import { describe, expect, it } from "vitest";
import { renderReport } from "../src/report.js";
import type { BatchReport } from "../src/types.js";

const BASE: BatchReport = {
	totalIssues: 3,
	parallelCount: 1,
	serialCount: 1,
	skippedForConfirmation: 1,
	implementations: [
		{
			issueNumber: 101,
			branch: "feature/101-mock",
			worktreePath: ".claude/worktrees/feature-101-mock",
			status: "success",
			unitTestsPassed: true,
			requiresSharedDbTests: true,
			attempts: 1,
		},
		{
			issueNumber: 201,
			branch: "feature/201-mock",
			worktreePath: ".claude/worktrees/feature-201-mock",
			status: "failed",
			unitTestsPassed: false,
			requiresSharedDbTests: false,
			attempts: 2,
			error: "mock 失敗",
		},
	],
	sharedDbTests: [
		{
			issueNumber: 101,
			branch: "feature/101-mock",
			passed: true,
			summary: "mock: IT/E2E green",
		},
	],
	awaitingConfirmation: [301],
};

describe("renderReport", () => {
	it("投入件数の内訳を出す", () => {
		const out = renderReport(BASE);
		expect(out).toContain("投入 Issue 数: 3（並列 1 / 直列 1 / 要確認 1）");
	});

	it("実装結果テーブルに各 Issue の行を出す", () => {
		const out = renderReport(BASE);
		expect(out).toContain(
			"| #101 | feature/101-mock | 成功 | green | 1 | 要 |",
		);
		expect(out).toContain(
			"| #201 | feature/201-mock | 失敗 | red | 2 | 不要 |",
		);
	});

	it("共有DBテスト結果を出す", () => {
		const out = renderReport(BASE);
		expect(out).toContain(
			"| #101 | feature/101-mock | green | mock: IT/E2E green |",
		);
	});

	it("人間確認待ちの Issue 番号を出す", () => {
		const out = renderReport(BASE);
		expect(out).toContain("#301");
		expect(out).toContain("人間確認待ち");
	});

	it("同じ入力なら同じ出力（決定論）", () => {
		expect(renderReport(BASE)).toBe(renderReport(BASE));
	});

	it("実装も共有DBテストも無いときはプレースホルダを出す", () => {
		const empty: BatchReport = {
			totalIssues: 0,
			parallelCount: 0,
			serialCount: 0,
			skippedForConfirmation: 0,
			implementations: [],
			sharedDbTests: [],
			awaitingConfirmation: [],
		};
		const out = renderReport(empty);
		expect(out).toContain("（実装対象なし）");
		expect(out).toContain("（要求なし）");
		// 確認待ちが無ければそのセクションは出さない
		expect(out).not.toContain("人間確認待ち");
	});
});
