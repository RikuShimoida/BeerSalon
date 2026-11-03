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
			use: {
				...devices["Desktop Chrome"],
				// Why not 本物の Google 地図スクリプトを読む: Google 側の更新で挙動が予告なく変わり、
				// ダミーキーだとピン描画の例外で検索 E2E が時々落ちた。地図の検証は
				// e2e/map-error-fallback.spec.ts が page.route で偽スクリプトを返して行う。
				launchOptions: {
					args: [
						"--host-resolver-rules=MAP maps.googleapis.com ~NOTFOUND, MAP maps.gstatic.com ~NOTFOUND",
					],
				},
			},
		},
	],
	webServer: {
		command: `pnpm exec next dev -p ${basePort}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		// Why not キー未設定のまま: 未設定だと地図コンポーネント自体を描画せず「キー未設定」の表示になり、
		// 地図が失敗したときの差し替え表示を E2E で確かめられない。キーの値は使われない（Google へは繋がない）。
		env: {
			NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "e2e-dummy-google-maps-key",
		},
	},
});
