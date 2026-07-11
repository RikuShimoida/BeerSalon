// 結果集約レポートの決定論的レンダリング。
// 自然言語スキル版では「一覧で報告する」を Claude の自由記述に委ねているが、
// ここでは同じ BatchReport から常に同じテキストを生成する（再現性・差分比較が可能になる）。

import type { BatchReport } from "./types.js";

/**
 * BatchReport を人間可読な Markdown テキストに変換する（純関数・副作用なし）。
 * 司令塔の完了報告にそのまま貼れる形にする。
 */
export function renderReport(report: BatchReport): string {
	const lines: string[] = [];

	lines.push("# 並列バッチ実行レポート");
	lines.push("");
	lines.push(
		`- 投入 Issue 数: ${report.totalIssues}（並列 ${report.parallelCount} / 直列 ${report.serialCount} / 要確認 ${report.skippedForConfirmation}）`,
	);
	lines.push("");

	lines.push("## 実装結果");
	if (report.implementations.length === 0) {
		lines.push("（実装対象なし）");
	} else {
		lines.push("| Issue | ブランチ | 状態 | UT | 試行 | 共有DBテスト要求 |");
		lines.push("|---|---|---|---|---|---|");
		for (const r of report.implementations) {
			lines.push(
				`| #${r.issueNumber} | ${r.branch} | ${statusLabel(r.status)} | ${r.unitTestsPassed ? "green" : "red"} | ${r.attempts} | ${r.requiresSharedDbTests ? "要" : "不要"} |`,
			);
		}
	}
	lines.push("");

	lines.push("## 共有DB依存テスト（IT/E2E・直列消化）");
	if (report.sharedDbTests.length === 0) {
		lines.push("（要求なし）");
	} else {
		lines.push("| Issue | ブランチ | 結果 | 概要 |");
		lines.push("|---|---|---|---|");
		for (const t of report.sharedDbTests) {
			lines.push(
				`| #${t.issueNumber} | ${t.branch} | ${t.passed ? "green" : "red"} | ${t.summary} |`,
			);
		}
	}
	lines.push("");

	if (report.awaitingConfirmation.length > 0) {
		lines.push("## 人間確認待ち（自動処理を保留）");
		lines.push(
			`以下は DB スキーマ変更の有無を機械判定できず、推測実装を避けるため保留しました: ${report.awaitingConfirmation
				.map((n) => `#${n}`)
				.join(", ")}`,
		);
		lines.push("");
	}

	return lines.join("\n");
}

function statusLabel(
	status: BatchReport["implementations"][number]["status"],
): string {
	return status === "success" ? "成功" : "失敗";
}
