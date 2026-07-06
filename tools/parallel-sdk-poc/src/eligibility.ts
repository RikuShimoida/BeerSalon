// Phase 0: 適格判定（決定論・純関数）。
// 自然言語スキル版では「各 Issue が DB スキーマを触るか」を Claude の判断に委ねている。
// ここではその判断ロジックをコード化し、同じ入力なら常に同じ振り分けになることを保証する。
//
// 根拠: docs/worktree-workflow.md §2①「DB スキーマ変更は直列ロック」。
// 全 worktree が単一物理 DB(54422 postgres)を共有するため、スキーマ変更を含むタスクを
// 2 つ同時に走らせると互いに壊し合う。よって serial レーンへ隔離する。

import type { EligibilityDecision, IssueInput } from "./types.js";

/**
 * DB スキーマ変更を「確実に含む」と判断できる強いシグナル。
 * これらが本文に現れたら serial 確定（人間確認は不要）。
 */
const SCHEMA_STRONG_SIGNALS: { pattern: RegExp; reason: string }[] = [
	{
		pattern: /prisma\/(schema\.prisma|migrations)/i,
		reason: "prisma/ スキーマ・マイグレーションへの言及",
	},
	{ pattern: /supabase\/migrations/i, reason: "supabase/migrations への言及" },
	{
		pattern: /prisma\s+migrate|prisma\s+generate/i,
		reason: "prisma migrate / generate の実行を要する",
	},
	{
		pattern: /マイグレーション|migration/i,
		reason: "マイグレーションへの言及",
	},
	{
		pattern:
			/(テーブル|カラム|column|table).{0,8}(追加|変更|削除|add|alter|drop|rename)/i,
		reason: "テーブル/カラムの追加・変更・削除への言及",
	},
	// Why not:「スキーマ変更 / schema change」という語そのものは強シグナルに含めない。
	// 「スキーマ変更有無：無」「no schema change」のような否定文脈で頻出し、否定を誤検知して
	// parallel を serial に倒してしまうため。矛盾検出は具体的シグナル（migrate 等）と否定の両立で行う。
];

/**
 * 「スキーマ変更なし」を示す強いシグナル。Issue テンプレの
 * 「スキーマ変更有無：無」を機械的に拾う。これがあれば parallel 確定。
 */
const SCHEMA_NEGATION_SIGNALS: RegExp[] = [
	/スキーマ変更有無\s*[:：]\s*無/i,
	/スキーマ変更\s*[:：]?\s*なし/i,
	/no\s+schema\s+change/i,
];

/**
 * ラベルによる強制振り分け。運用でラベルを付けておけば本文解析より優先される。
 */
const SERIAL_LABELS = ["db-schema", "migration", "schema-change"];

/**
 * 判定は迷いを許さないが、シグナルが一切無い場合は「推測実装禁止」原則に従い
 * 人間確認フラグを立てる。DB を触るかは false 断定せず、確認に回す。
 */
export function classifyIssue(issue: IssueInput): EligibilityDecision {
	const reasons: string[] = [];

	// 1) ラベルは最優先。運用で明示された意図をコード解析より上に置く。
	const serialLabel = issue.labels.find((l) =>
		SERIAL_LABELS.includes(l.toLowerCase()),
	);
	if (serialLabel) {
		return {
			issue,
			lane: "serial",
			touchesSchema: true,
			reasons: [`ラベル "${serialLabel}" によりスキーマ変更タスクと明示`],
			needsHumanConfirmation: false,
		};
	}

	// 2) 「スキーマ変更なし」の明示があれば parallel 確定。
	const negated = SCHEMA_NEGATION_SIGNALS.some((re) => re.test(issue.body));

	// 3) スキーマ変更の強いシグナルを集める。
	const hits = SCHEMA_STRONG_SIGNALS.filter((s) => s.pattern.test(issue.body));

	if (hits.length > 0) {
		// 「変更なし」明示と強シグナルが両立するのは Issue 記述の矛盾。
		// 安全側（serial）に倒しつつ、人間確認フラグを立てて矛盾を可視化する。
		const contradictory = negated;
		return {
			issue,
			lane: "serial",
			touchesSchema: true,
			reasons: contradictory
				? [
						...hits.map((h) => h.reason),
						"『スキーマ変更なし』の記述と矛盾。安全側で serial 化し確認を要求",
					]
				: hits.map((h) => h.reason),
			needsHumanConfirmation: contradictory,
		};
	}

	if (negated) {
		return {
			issue,
			lane: "parallel",
			touchesSchema: false,
			reasons: ["Issue に『スキーマ変更なし』が明示されている"],
			needsHumanConfirmation: false,
		};
	}

	// 4) どのシグナルも無い = コードだけでは断定不能。
	//    推測で parallel に入れず、人間に「スキーマを触るか」を確認する。
	reasons.push(
		"スキーマ変更の有無を示すシグナルが本文・ラベルに無く、コードでは断定不能",
	);
	return {
		issue,
		lane: "serial", // 確認が付くまでは安全側（直列）に置く
		touchesSchema: false,
		reasons,
		needsHumanConfirmation: true,
	};
}

/**
 * 複数 Issue を一括で判定し、並列レーン・直列レーン・要確認に振り分ける。
 * 司令塔はこの結果をそのまま実行計画に使える（並列は Promise.all、直列は逐次）。
 */
export function classifyBatch(issues: IssueInput[]): {
	parallel: EligibilityDecision[];
	serial: EligibilityDecision[];
	needsConfirmation: EligibilityDecision[];
} {
	const decisions = issues.map(classifyIssue);
	return {
		parallel: decisions.filter(
			(d) => d.lane === "parallel" && !d.needsHumanConfirmation,
		),
		serial: decisions.filter(
			(d) => d.lane === "serial" && !d.needsHumanConfirmation,
		),
		needsConfirmation: decisions.filter((d) => d.needsHumanConfirmation),
	};
}
