// PoC 実行エントリ（dry-run 実演）。
// `pnpm poc` で起動。実 SDK・実 worktree・実 DB には触れず、
// 「Phase 0 振り分け → Phase 1 並列＋直列 → Phase 2 共有 DB テスト直列 → 集約レポート」
// という司令塔ロジックの骨格が決定論的に動くことを標準出力で確認する。
//
// 実 SDK に切り替えたい場合は createMockRunner を createSdkRunner(repoRoot) に差し替える
//（sdk-runner.ts 参照）。差し替え点が 1 箇所で済むのが、決定論部分を SDK から切り離した狙い。

import { createMockRunner } from "./mock-runner.js";
import { runBatch } from "./orchestrator.js";
import { renderReport } from "./report.js";
import type { IssueInput } from "./types.js";

// 実運用では `gh issue view <n> --json number,title,body,labels` の結果から組む。
// dry-run では代表的な 4 パターンを手で用意する。
const SAMPLE_ISSUES: IssueInput[] = [
	{
		number: 401,
		title: "タイムラインのいいねボタンにアニメーション追加",
		body: "UI のみの変更。スキーマ変更有無：無。",
		labels: [],
	},
	{
		number: 402,
		title: "店舗詳細のクーポンタブ表示崩れ修正",
		body: "CSS の修正のみ。データ要件なし。no schema change。",
		labels: [],
	},
	{
		number: 403,
		title: "通知テーブルに既読日時カラムを追加",
		body: "notifications テーブルに read_at カラムを追加する。prisma/schema.prisma とマイグレーションが必要。",
		labels: [],
	},
	{
		number: 404,
		title: "検索結果の並び順を見直す",
		body: "並び順ロジックの調整。スキーマを触るかは記述が曖昧で判断が必要。",
		labels: [],
	},
];

async function main(): Promise<void> {
	// #403 は共有 DB 依存テスト(IT/E2E)を要求し、#401 はリトライ 1 回で成功する設定にして、
	// 並列・直列・リトライ・共有 DB キューの 4 挙動を 1 回の実演で観測する。
	const runner = createMockRunner({
		failUntilAttempt: { 401: 1 },
		requiresSharedDbTests: [403, 402],
	});

	const report = await runBatch(SAMPLE_ISSUES, runner, { maxAttempts: 2 });

	console.log(renderReport(report));
	console.log("\n---\n実行トレース（並列/直列の観測）:");
	for (const t of runner.trace) {
		const conc =
			t.concurrentImpl !== undefined
				? ` concurrentImpl=${t.concurrentImpl}`
				: "";
		const att = t.attempt !== undefined ? ` attempt=${t.attempt}` : "";
		console.log(`  ${t.event} #${t.issueNumber}${att}${conc}`);
	}
}

main().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
