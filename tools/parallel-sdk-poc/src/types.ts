// Issue #373 PoC の型定義。
// /parallel 司令塔ロジックのうち「決定論的にコードで表現できる部分」を型で固定する。
// SDK 非依存（ここに @anthropic-ai/claude-agent-sdk を import しない）。純粋な入出力契約のみを置く。

/**
 * 並列バッチに投入する 1 Issue の入力。
 * 実運用では `gh issue view <n>` の結果から組み立てることを想定するが、
 * 決定論部分の検証では手で組んだオブジェクトをそのまま流し込めるようにしておく。
 */
export type IssueInput = {
	number: number;
	title: string;
	/** Issue 本文（適格判定のヒント抽出に使う） */
	body: string;
	/** Issue に付いたラベル名の配列 */
	labels: string[];
};

/**
 * Phase 0 適格判定の結果。
 * `serial` = DB スキーマ変更を含むため直列レーンへ。`parallel` = 並列レーンで同時実装可。
 */
export type EligibilityLane = "parallel" | "serial";

export type EligibilityDecision = {
	issue: IssueInput;
	lane: EligibilityLane;
	/** DB スキーマ変更を含むと判定したか（直列化の主因） */
	touchesSchema: boolean;
	/** 判定理由（どのシグナルで serial にしたか。監査可能にするため必ず言語化する） */
	reasons: string[];
	/**
	 * コードだけでは判定しきれず人間の確認が必要か。
	 * true のとき、司令塔は推測実装せずユーザーに「スキーマを触るか」を確認する
	 *（CLAUDE.md「推測実装・それっぽく動く実装は禁止」に対応）。
	 */
	needsHumanConfirmation: boolean;
};

/**
 * 1 Issue の実装フェーズ（worktree 作成〜実装〜UT）の結果。
 * SDK のサブエージェント（frontend-engineer 相当）1 体分の最終報告に対応する。
 */
export type ImplementationResult = {
	issueNumber: number;
	branch: string;
	worktreePath: string;
	status: "success" | "failed";
	/** UT が green か（共有 DB に触らない範囲。worktree 内で完結） */
	unitTestsPassed: boolean;
	/** IT/E2E（共有 DB 依存）を要求するか。true なら Phase 2 の直列キューへ積む */
	requiresSharedDbTests: boolean;
	/** リトライ回数（0 = 初回成功） */
	attempts: number;
	/** 失敗時のエラー要約（success 時は undefined） */
	error?: string;
};

/**
 * Phase 2 の共有 DB 依存テスト（IT/E2E）1 件分の結果。
 * qa-engineer を 1 体ずつ直列起動して消化した結果に対応する。
 */
export type SharedDbTestResult = {
	issueNumber: number;
	branch: string;
	passed: boolean;
	summary: string;
};

/**
 * バッチ全体の最終集約レポート。決定論的に生成する（同じ入力なら同じレポート）。
 */
export type BatchReport = {
	totalIssues: number;
	parallelCount: number;
	serialCount: number;
	skippedForConfirmation: number;
	implementations: ImplementationResult[];
	sharedDbTests: SharedDbTestResult[];
	/** 人間の確認が必要で自動処理を保留した Issue 番号 */
	awaitingConfirmation: number[];
};

/**
 * 実装フェーズを実行する「ランナー」の抽象。
 * - dry-run ではモックランナーを差し込み、実 SDK・実 worktree・実 DB に触れずに骨格を検証する。
 * - 本番では Agent SDK の query() を叩くランナーを差し込む。
 * この差し替え点があることで、決定論ロジック（振り分け・集約・リトライ）を SDK から切り離して UT できる。
 */
export interface AgentRunner {
	/** 1 Issue の実装（worktree 作成〜実装〜UT）を 1 回試行する */
	runImplementation(issue: IssueInput): Promise<ImplementationResult>;
	/** 1 Issue の共有 DB 依存テスト（IT/E2E）を実行する */
	runSharedDbTests(impl: ImplementationResult): Promise<SharedDbTestResult>;
}
