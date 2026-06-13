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

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
	},
});
