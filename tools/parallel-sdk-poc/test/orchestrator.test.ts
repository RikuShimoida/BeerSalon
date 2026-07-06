import { describe, expect, it } from "vitest";
import { createMockRunner } from "../src/mock-runner.js";
import { runBatch } from "../src/orchestrator.js";
import type { IssueInput } from "../src/types.js";

function issue(partial: Partial<IssueInput> & { number: number }): IssueInput {
	return { title: "t", body: "", labels: [], ...partial };
}

// 並列レーン向け（スキーマ変更なし明示）と直列レーン向け（スキーマ変更あり）を用意する。
const PARALLEL_A = issue({ number: 101, body: "スキーマ変更有無：無" });
const PARALLEL_B = issue({ number: 102, body: "no schema change" });
const SERIAL_A = issue({ number: 201, body: "prisma/migrations を追加" });
const SERIAL_B = issue({ number: 202, body: "テーブルにカラムを追加" });
const AMBIGUOUS = issue({ number: 301, body: "曖昧で判断不能" });

describe("runBatch - 振り分けと集約", () => {
	it("並列・直列・要確認の件数をレポートに反映する", async () => {
		const runner = createMockRunner();
		const report = await runBatch(
			[PARALLEL_A, PARALLEL_B, SERIAL_A, AMBIGUOUS],
			runner,
		);

		expect(report.totalIssues).toBe(4);
		expect(report.parallelCount).toBe(2);
		expect(report.serialCount).toBe(1);
		expect(report.skippedForConfirmation).toBe(1);
		expect(report.awaitingConfirmation).toEqual([301]);
	});

	it("要確認 Issue は実装フェーズに回さない（自動処理を保留）", async () => {
		const runner = createMockRunner();
		const report = await runBatch([AMBIGUOUS], runner);

		expect(report.implementations).toHaveLength(0);
		expect(report.awaitingConfirmation).toEqual([301]);
		// ランナーは一度も呼ばれない
		expect(runner.trace).toHaveLength(0);
	});
});

describe("runBatch - 並列レーンは同時実行", () => {
	it("並列レーンの実装は Promise.all で同時に走り出す（concurrentImpl>1 が観測される）", async () => {
		const runner = createMockRunner();
		await runBatch([PARALLEL_A, PARALLEL_B], runner);

		const starts = runner.trace.filter((t) => t.event === "impl-start");
		const maxConcurrent = Math.max(...starts.map((s) => s.concurrentImpl ?? 0));
		// 2 本の並列レーンが同時に起動しているので、同時実行数は 2 に達する
		expect(maxConcurrent).toBe(2);
	});
});

describe("runBatch - 直列レーンは逐次実行", () => {
	it("直列レーンの実装は 1 本ずつ（同時実行数が 1 を超えない）", async () => {
		const runner = createMockRunner();
		await runBatch([SERIAL_A, SERIAL_B], runner);

		const starts = runner.trace.filter((t) => t.event === "impl-start");
		const maxConcurrent = Math.max(...starts.map((s) => s.concurrentImpl ?? 0));
		// 直列レーンは for-of await なので同時実行数は常に 1
		expect(maxConcurrent).toBe(1);
	});

	it("直列レーンは 1 本目が終わってから 2 本目が始まる（start/end の順序）", async () => {
		const runner = createMockRunner();
		await runBatch([SERIAL_A, SERIAL_B], runner);

		// impl 系イベントだけ抜き出して順序を確認
		const impl = runner.trace.filter(
			(t) => t.event === "impl-start" || t.event === "impl-end",
		);
		expect(impl.map((t) => `${t.event}:${t.issueNumber}`)).toEqual([
			"impl-start:201",
			"impl-end:201",
			"impl-start:202",
			"impl-end:202",
		]);
	});
});

describe("runBatch - リトライ制御", () => {
	it("1 回目失敗・2 回目成功なら attempts=2 で success", async () => {
		const runner = createMockRunner({ failUntilAttempt: { 101: 1 } });
		const report = await runBatch([PARALLEL_A], runner, { maxAttempts: 2 });

		const r = report.implementations.find((x) => x.issueNumber === 101);
		expect(r?.status).toBe("success");
		expect(r?.attempts).toBe(2);
	});

	it("maxAttempts を使い切っても失敗なら status=failed で最後の結果を返す", async () => {
		const runner = createMockRunner({ failUntilAttempt: { 101: 5 } });
		const report = await runBatch([PARALLEL_A], runner, { maxAttempts: 2 });

		const r = report.implementations.find((x) => x.issueNumber === 101);
		expect(r?.status).toBe("failed");
		expect(r?.attempts).toBe(2);
		expect(r?.error).toBeDefined();
	});

	it("maxAttempts=1 ならリトライしない", async () => {
		const runner = createMockRunner({ failUntilAttempt: { 101: 1 } });
		const report = await runBatch([PARALLEL_A], runner, { maxAttempts: 1 });

		const r = report.implementations.find((x) => x.issueNumber === 101);
		expect(r?.status).toBe("failed");
		expect(r?.attempts).toBe(1);
	});
});

describe("runBatch - 共有DB依存テストの直列キュー", () => {
	it("requiresSharedDbTests=true の成功実装だけがキューに乗る", async () => {
		const runner = createMockRunner({ requiresSharedDbTests: [101] });
		// 102 は共有DBテスト不要
		const report = await runBatch([PARALLEL_A, PARALLEL_B], runner);

		expect(report.sharedDbTests.map((t) => t.issueNumber)).toEqual([101]);
		expect(report.sharedDbTests[0]?.passed).toBe(true);
	});

	it("失敗した実装は共有DBテストに回さない", async () => {
		const runner = createMockRunner({
			failUntilAttempt: { 101: 5 },
			requiresSharedDbTests: [101],
		});
		const report = await runBatch([PARALLEL_A], runner, { maxAttempts: 1 });

		// 実装が failed なので共有DBテストキューは空
		expect(report.sharedDbTests).toHaveLength(0);
	});

	it("共有DBテストは 1 件ずつ直列に消化する（start/end が交互）", async () => {
		const runner = createMockRunner({ requiresSharedDbTests: [201, 202] });
		await runBatch([SERIAL_A, SERIAL_B], runner);

		const shared = runner.trace.filter(
			(t) => t.event === "shared-start" || t.event === "shared-end",
		);
		expect(shared.map((t) => `${t.event}:${t.issueNumber}`)).toEqual([
			"shared-start:201",
			"shared-end:201",
			"shared-start:202",
			"shared-end:202",
		]);
	});

	it("共有DBテストの失敗を passed=false で報告する", async () => {
		const runner = createMockRunner({
			requiresSharedDbTests: [101],
			failSharedDbTests: [101],
		});
		const report = await runBatch([PARALLEL_A], runner);

		expect(report.sharedDbTests[0]?.passed).toBe(false);
	});
});
