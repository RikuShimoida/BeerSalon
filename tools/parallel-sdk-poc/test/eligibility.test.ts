import { describe, expect, it } from "vitest";
import { classifyBatch, classifyIssue } from "../src/eligibility.js";
import type { IssueInput } from "../src/types.js";

function issue(partial: Partial<IssueInput> & { number: number }): IssueInput {
	return {
		title: "t",
		body: "",
		labels: [],
		...partial,
	};
}

describe("classifyIssue - スキーマ変更の強シグナル", () => {
	it("prisma/schema.prisma への言及は serial", () => {
		const d = classifyIssue(
			issue({ number: 1, body: "prisma/schema.prisma を編集" }),
		);
		expect(d.lane).toBe("serial");
		expect(d.touchesSchema).toBe(true);
		expect(d.needsHumanConfirmation).toBe(false);
		expect(d.reasons.join()).toMatch(/prisma/i);
	});

	it("supabase/migrations への言及は serial", () => {
		const d = classifyIssue(
			issue({ number: 2, body: "supabase/migrations に SQL を追加" }),
		);
		expect(d.lane).toBe("serial");
		expect(d.touchesSchema).toBe(true);
	});

	it("『テーブルにカラムを追加』は serial", () => {
		const d = classifyIssue(
			issue({
				number: 3,
				body: "notifications テーブルに read_at カラムを追加する",
			}),
		);
		expect(d.lane).toBe("serial");
		expect(d.touchesSchema).toBe(true);
	});

	it("『マイグレーション』の語だけでも serial", () => {
		const d = classifyIssue(
			issue({ number: 4, body: "マイグレーションを流す必要がある" }),
		);
		expect(d.lane).toBe("serial");
	});
});

describe("classifyIssue - スキーマ変更なしの明示", () => {
	it("『スキーマ変更有無：無』は parallel", () => {
		const d = classifyIssue(
			issue({ number: 10, body: "UI のみ。スキーマ変更有無：無。" }),
		);
		expect(d.lane).toBe("parallel");
		expect(d.touchesSchema).toBe(false);
		expect(d.needsHumanConfirmation).toBe(false);
	});

	it("『no schema change』は parallel", () => {
		const d = classifyIssue(
			issue({ number: 11, body: "CSS only. no schema change." }),
		);
		expect(d.lane).toBe("parallel");
	});
});

describe("classifyIssue - ラベルの最優先", () => {
	it("db-schema ラベルは本文に関係なく serial", () => {
		const d = classifyIssue(
			issue({
				number: 20,
				body: "スキーマ変更有無：無",
				labels: ["db-schema"],
			}),
		);
		// 本文は「無」だがラベルが優先され serial になる
		expect(d.lane).toBe("serial");
		expect(d.reasons.join()).toMatch(/ラベル/);
	});

	it("migration ラベル（大文字混じり）も serial", () => {
		const d = classifyIssue(
			issue({ number: 21, body: "", labels: ["Migration"] }),
		);
		expect(d.lane).toBe("serial");
	});
});

describe("classifyIssue - 判断不能・矛盾", () => {
	it("シグナルが一切無ければ要確認（安全側 serial）", () => {
		const d = classifyIssue(
			issue({ number: 30, body: "並び順ロジックの調整。曖昧。" }),
		);
		expect(d.needsHumanConfirmation).toBe(true);
		expect(d.lane).toBe("serial"); // 確認が付くまでは安全側
	});

	it("『変更なし』と強シグナルが両立する矛盾は serial + 要確認", () => {
		const d = classifyIssue(
			issue({
				number: 31,
				body: "スキーマ変更有無：無。ただし prisma migrate を実行する。",
			}),
		);
		expect(d.lane).toBe("serial");
		expect(d.needsHumanConfirmation).toBe(true);
		expect(d.reasons.join()).toMatch(/矛盾/);
	});
});

describe("classifyBatch - 一括振り分け", () => {
	it("並列・直列・要確認に正しく振り分ける", () => {
		const { parallel, serial, needsConfirmation } = classifyBatch([
			issue({ number: 1, body: "スキーマ変更有無：無" }), // parallel
			issue({ number: 2, body: "CSS only. no schema change." }), // parallel
			issue({ number: 3, body: "prisma/migrations を追加" }), // serial
			issue({ number: 4, body: "曖昧で判断不能" }), // needsConfirmation
		]);
		expect(parallel.map((d) => d.issue.number).sort()).toEqual([1, 2]);
		expect(serial.map((d) => d.issue.number)).toEqual([3]);
		expect(needsConfirmation.map((d) => d.issue.number)).toEqual([4]);
	});

	it("要確認は parallel/serial のどちらのレーンにも入れない", () => {
		const { parallel, serial, needsConfirmation } = classifyBatch([
			issue({ number: 5, body: "曖昧" }),
		]);
		expect(parallel).toHaveLength(0);
		expect(serial).toHaveLength(0);
		expect(needsConfirmation).toHaveLength(1);
	});
});
