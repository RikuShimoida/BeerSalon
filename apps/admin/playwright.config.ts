import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Why not: Next.js dev サーバーは .env.local を自動読み込みするが、
//          Playwright テストプロセス自体は別プロセスのため自動では読まない。
//          ローカルとCIで E2E_ADMIN_PASSWORD などを揃えるために明示ロードする。
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({
	path: path.resolve(__dirname, ".env.e2e.local"),
	override: true,
});

// Why not: baseURL/ポートを固定しない。worktree 並列開発では別ポートで起動した
//          dev サーバーに対して E2E を流す必要があるため、環境変数で差し替え可能にする。
const ADMIN_PORT = process.env.E2E_ADMIN_PORT ?? "3001";
const ADMIN_BASE_URL =
	process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://localhost:${ADMIN_PORT}`;

/**
 * Playwright E2E テスト設定
 * 詳細: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests",

	// テストのタイムアウト設定
	timeout: 30000,

	// 並列実行の設定
	fullyParallel: true,

	// CI環境では.only()を禁止
	forbidOnly: !!process.env.CI,

	// CI環境ではリトライを有効化
	retries: process.env.CI ? 2 : 0,

	// CI環境では並列実行を無効化（安定性のため）
	workers: process.env.CI ? 1 : undefined,

	// レポーター設定
	reporter: [
		["html", { open: "never" }],
		["list"],
		...(process.env.CI ? [["github"] as const] : []),
	],

	// 共通のブラウザ設定
	use: {
		// ベースURL
		baseURL: ADMIN_BASE_URL,

		// 失敗時のトレース記録
		trace: "on-first-retry",

		// 失敗時のスクリーンショット
		screenshot: "only-on-failure",

		// ビデオ録画（失敗時のみ）
		video: "retain-on-failure",

		// アクションのタイムアウト
		actionTimeout: 10000,
	},

	// テストプロジェクト（ブラウザ）
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		// 追加のブラウザでテストする場合はコメントを外す
		// {
		//   name: 'firefox',
		//   use: { ...devices['Desktop Firefox'] },
		// },
		// {
		//   name: 'webkit',
		//   use: { ...devices['Desktop Safari'] },
		// },

		// モバイルブラウザでテストする場合
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },
	],

	// 開発サーバーの自動起動
	webServer: {
		command: `pnpm exec next dev -p ${ADMIN_PORT}`,
		url: ADMIN_BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
