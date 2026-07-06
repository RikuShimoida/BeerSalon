// dry-run 用モックランナー: 実 SDK・実 worktree・実 DB に一切触れない。
// 「並列/直列の振り分け・リトライ・結果集約の骨格が動くこと」だけを決定論的に検証する。
//
// 実行順序を観測できるよう log を残す。並列レーンが Promise.all で同時に走り出し、
// 直列レーン・共有 DB テストが逐次で消化されることをテストで確認できるようにする。

import type {
	AgentRunner,
	ImplementationResult,
	IssueInput,
	SharedDbTestResult,
} from "./types.js";

export type MockRunnerConfig = {
	/**
	 * この Issue 番号は実装フェーズで指定回数まで失敗させる（リトライ検証用）。
	 * key=Issue番号, value=失敗させる試行回数。例 {305: 1} なら 1 回目失敗・2 回目成功。
	 */
	failUntilAttempt?: Record<number, number>;
	/** この Issue 番号は共有 DB 依存テストを要求する（IT/E2E キュー検証用） */
	requiresSharedDbTests?: number[];
	/** 共有 DB テストを失敗させる Issue 番号 */
	failSharedDbTests?: number[];
};

/**
 * 実行トレース。テストが順序・並行性を検証するために使う。
 */
export type RunnerTrace = {
	event: "impl-start" | "impl-end" | "shared-start" | "shared-end";
	issueNumber: number;
	attempt?: number;
	/** 呼び出し時点で「実装フェーズが同時に何本走っているか」（並行性の観測用） */
	concurrentImpl?: number;
};

export function createMockRunner(config: MockRunnerConfig = {}): AgentRunner & {
	trace: RunnerTrace[];
} {
	const failUntil = config.failUntilAttempt ?? {};
	const requiresSharedDb = new Set(config.requiresSharedDbTests ?? []);
	const failShared = new Set(config.failSharedDbTests ?? []);
	const attemptCount = new Map<number, number>();
	const trace: RunnerTrace[] = [];

	// 実装フェーズの同時実行本数を数える（並列レーンが本当に同時起動しているかの観測）。
	let concurrentImpl = 0;

	const runner: AgentRunner & { trace: RunnerTrace[] } = {
		trace,

		async runImplementation(issue: IssueInput): Promise<ImplementationResult> {
			const attempt = (attemptCount.get(issue.number) ?? 0) + 1;
			attemptCount.set(issue.number, attempt);

			concurrentImpl++;
			trace.push({
				event: "impl-start",
				issueNumber: issue.number,
				attempt,
				concurrentImpl,
			});

			// 実 I/O は行わない。マイクロタスクを 1 つ挟んで並行性を観測可能にするだけ。
			await Promise.resolve();

			const branch = `feature/${issue.number}-mock`;
			const worktreePath = `.claude/worktrees/${branch.replaceAll("/", "-")}`;

			const shouldFail = attempt <= (failUntil[issue.number] ?? 0);

			concurrentImpl--;
			trace.push({ event: "impl-end", issueNumber: issue.number, attempt });

			if (shouldFail) {
				return {
					issueNumber: issue.number,
					branch,
					worktreePath,
					status: "failed",
					unitTestsPassed: false,
					requiresSharedDbTests: false,
					attempts: attempt,
					error: `mock: attempt ${attempt} を意図的に失敗`,
				};
			}

			return {
				issueNumber: issue.number,
				branch,
				worktreePath,
				status: "success",
				unitTestsPassed: true,
				requiresSharedDbTests: requiresSharedDb.has(issue.number),
				attempts: attempt,
			};
		},

		async runSharedDbTests(
			impl: ImplementationResult,
		): Promise<SharedDbTestResult> {
			trace.push({ event: "shared-start", issueNumber: impl.issueNumber });
			await Promise.resolve();
			trace.push({ event: "shared-end", issueNumber: impl.issueNumber });

			const passed = !failShared.has(impl.issueNumber);
			return {
				issueNumber: impl.issueNumber,
				branch: impl.branch,
				passed,
				summary: passed ? "mock: IT/E2E green" : "mock: IT/E2E red",
			};
		},
	};

	return runner;
}
