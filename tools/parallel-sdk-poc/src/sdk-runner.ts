// 本番用ランナー: Claude Agent SDK の query() でサブエージェントを起動する。
// worktree 作成〜実装〜UT を frontend-engineer 相当のサブエージェントに走らせ、
// 共有 DB 依存テストは qa-engineer 相当に走らせる。
//
// 注意: このファイルは「SDK 連携の形」を示す実装骨格。dry-run では読み込まれない
//（main.ts が MockAgentRunner を使う）。実運用に切り替える際にここを差し込む。
// SDK 呼び出しは実 worktree・実 DB に触れるため、PoC の既定フローからは切り離してある。

import { query } from "@anthropic-ai/claude-agent-sdk";
import type {
	AgentRunner,
	ImplementationResult,
	IssueInput,
	SharedDbTestResult,
} from "./types.js";

/**
 * frontend-engineer / qa-engineer に相当するサブエージェント定義。
 * tools は最小権限で絞る（実装は編集系、検証は読み取り＋Playwright 系のみ）。
 */
const AGENTS = {
	"frontend-engineer": {
		description:
			"worktree を develop 起点で作成し、実装と UT までを完結させる実装エージェント",
		prompt:
			"あなたは BeerSalon の frontend-engineer です。指定された Issue について、" +
			"develop 起点の worktree 内で実装し、pnpm test(UT) を green にするところまでを行います。" +
			"IT/E2E など共有 DB に触るテストはここでは実行しません。",
		tools: ["Read", "Edit", "Write", "Bash", "Grep", "Glob"],
	},
	"qa-engineer": {
		description:
			"共有 DB 依存テスト(IT/E2E)を 1 件だけ実行し受入条件を検証する QA エージェント",
		prompt:
			"あなたは BeerSalon の qa-engineer です。指定 worktree の IT/E2E を実行し受入条件を検証します。" +
			"共有 DB と固定ポートを使うため、同時に複数走らせてはいけません（このランナーは常に 1 体ずつ呼びます）。",
		tools: ["Read", "Grep", "Glob", "Bash"],
	},
};

/**
 * query() を最後まで回して result メッセージのテキストを取り出す小さなヘルパ。
 * SDK の Query は AsyncGenerator なので for await で消費する。
 */
async function collectResult(prompt: string, cwd: string): Promise<string> {
	let result = "";
	for await (const message of query({
		prompt,
		options: {
			cwd,
			allowedTools: ["Read", "Edit", "Write", "Bash", "Grep", "Glob", "Agent"],
			agents: AGENTS,
			permissionMode: "acceptEdits",
		},
	})) {
		if (message.type === "result" && "result" in message) {
			result = String((message as { result: unknown }).result ?? "");
		}
	}
	return result;
}

/**
 * SDK を実際に叩くランナー。dry-run では使わない。
 * ここでは「SDK 連携の入口がどう嵌まるか」を示すことを主眼にし、
 * result テキストのパースは最小限（実運用では構造化出力スキーマで受けるのが望ましい）。
 */
export function createSdkRunner(repoRoot: string): AgentRunner {
	return {
		async runImplementation(issue: IssueInput): Promise<ImplementationResult> {
			const branch = `feature/${issue.number}-sdk-poc`;
			const worktreePath = `.claude/worktrees/${branch.replace("/", "-")}`;
			try {
				const text = await collectResult(
					`Issue #${issue.number}「${issue.title}」を /impl の Phase 1 手順で実装してください。` +
						`worktree は ${worktreePath} に develop 起点で作成し、実装と UT(pnpm test) まで行ってください。`,
					repoRoot,
				);
				return {
					issueNumber: issue.number,
					branch,
					worktreePath,
					status: "success",
					unitTestsPassed: /green|passed|全て.*パス/i.test(text),
					requiresSharedDbTests: /e2e|integration|受入|shared\s*db/i.test(text),
					attempts: 1,
				};
			} catch (e) {
				return {
					issueNumber: issue.number,
					branch,
					worktreePath,
					status: "failed",
					unitTestsPassed: false,
					requiresSharedDbTests: false,
					attempts: 1,
					error: e instanceof Error ? e.message : String(e),
				};
			}
		},

		async runSharedDbTests(
			impl: ImplementationResult,
		): Promise<SharedDbTestResult> {
			const text = await collectResult(
				`worktree ${impl.worktreePath} の IT/E2E を実行し、受入条件を検証してください（1 体だけで実行）。`,
				repoRoot,
			);
			return {
				issueNumber: impl.issueNumber,
				branch: impl.branch,
				passed: /green|passed|成功/i.test(text),
				summary: text.slice(0, 200),
			};
		},
	};
}
