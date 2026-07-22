import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Why not: Next.js dev サーバーは .env.local を自動読み込みするが、
//          Playwright テストプロセス自体は別プロセスのため自動では読まない。
//          ローカルとCIで E2E_TEST_USER_PASSWORD などを揃えるために明示ロードする。
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({
	path: path.resolve(__dirname, ".env.e2e.local"),
	override: true,
});

// Why not: baseURL/webServer を 3000 にハードコードすると、worktree 並列運用時に
//          E2E ランナーが reuseExistingServer で司令塔（別ディレクトリ）の 3000 を
//          再利用してしまい、worktree 側の変更コードを検証できない。既定は 3000 の
//          ままにして CI・従来挙動を保ちつつ、E2E_BASE_URL で別ポートへ向けられるようにする。
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// Why not: webServer.command は既定で -p 3000 のため、E2E_BASE_URL でポートを変えても
//          command 側が 3000 を掴もうとして EADDRINUSE になる。baseURL のポートを
//          command にも渡し、url と起動ポートを一致させる。
const basePort = new URL(baseURL).port || "3000";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: `pnpm exec next dev -p ${basePort}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
	},
});
