// 司令塔オーケストレーター（決定論的な制御フロー）。
// 自然言語スキル版では Phase 1(並列)・Phase 2(直列)・リトライを Claude の判断に委ねている。
// ここではそれを「コード構造そのもの」で表現する:
//   - 並列レーン: Promise.all で同時実行（実装＋UT まで。共有 DB に触らないので安全）
//   - 直列レーン + 共有 DB 依存テスト: for await の逐次実行（共有 DB/固定ポート競合を構造で回避）
//   - リトライ: 失敗時に決定論的な回数だけ再試行（自然言語スキル版に無い付加価値）
//
// 根拠: docs/worktree-workflow.md §3「共有 DB 依存テストは司令塔での直列キュー」。

import { classifyBatch } from "./eligibility.js";
import type {
	AgentRunner,
	BatchReport,
	ImplementationResult,
	IssueInput,
} from "./types.js";

export type OrchestratorOptions = {
	/** 実装フェーズの最大試行回数（1 = リトライなし）。既定 2。 */
	maxAttempts?: number;
};

/**
 * 1 Issue の実装を、失敗したら決定論的に再試行する。
 * リトライ制御をコードに持つことで「何回まで粘るか」を再現可能にする。
 */
async function runImplementationWithRetry(
	runner: AgentRunner,
	issue: IssueInput,
	maxAttempts: number,
): Promise<ImplementationResult> {
	let last: ImplementationResult | undefined;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const result = await runner.runImplementation(issue);
		// ランナーが自前で数えた attempts より、オーケストレーター視点の試行回数を正とする。
		last = { ...result, attempts: attempt };
		if (result.status === "success") return last;
	}
	// maxAttempts 使い切っても失敗なら、最後の失敗結果を返す（握りつぶさない）。
	return last as ImplementationResult;
}

/**
 * バッチ全体を実行する。
 *
 * 実行順:
 *  1. Phase 0: classifyBatch で並列/直列/要確認へ振り分け（決定論）
 *  2. Phase 1(並列レーン): Promise.all で同時に実装＋UT
 *  3. Phase 1'(直列レーン): for-of で 1 件ずつ実装＋UT（スキーマ競合を構造で回避）
 *  4. Phase 2: 共有 DB 依存テストを要求した worktree を 1 体ずつ直列消化
 *  5. 集約レポートを決定論的に生成
 *
 * 要確認 Issue は自動処理せず awaitingConfirmation に載せて人間に返す
 *（CLAUDE.md「推測実装禁止」に対応）。
 */
export async function runBatch(
	issues: IssueInput[],
	runner: AgentRunner,
	options: OrchestratorOptions = {},
): Promise<BatchReport> {
	const maxAttempts = options.maxAttempts ?? 2;
	const { parallel, serial, needsConfirmation } = classifyBatch(issues);

	// Phase 1(並列レーン): 共有 DB に触らない実装＋UT のみ。Promise.all で同時実行。
	const parallelResults = await Promise.all(
		parallel.map((d) =>
			runImplementationWithRetry(runner, d.issue, maxAttempts),
		),
	);

	// Phase 1'(直列レーン): スキーマ変更を含むため 1 件ずつ。
	// for-of + await でコード構造として逐次を強制する（並列化しない）。
	const serialResults: ImplementationResult[] = [];
	for (const d of serial) {
		serialResults.push(
			await runImplementationWithRetry(runner, d.issue, maxAttempts),
		);
	}

	const implementations = [...parallelResults, ...serialResults];

	// Phase 2: 共有 DB 依存テスト（IT/E2E）を要求した worktree を直列消化。
	// 成功した実装のうち requiresSharedDbTests=true のものだけが対象。
	const sharedDbTargets = implementations.filter(
		(r) => r.status === "success" && r.requiresSharedDbTests,
	);
	const sharedDbTests = [];
	for (const impl of sharedDbTargets) {
		sharedDbTests.push(await runner.runSharedDbTests(impl));
	}

	return {
		totalIssues: issues.length,
		parallelCount: parallel.length,
		serialCount: serial.length,
		skippedForConfirmation: needsConfirmation.length,
		implementations,
		sharedDbTests,
		awaitingConfirmation: needsConfirmation.map((d) => d.issue.number),
	};
}
