import { defineConfig, devices } from "@playwright/test";

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
		baseURL: "http://localhost:3001",

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
		command: "npm run dev",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
