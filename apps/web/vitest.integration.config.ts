import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "vitest/config";

// Why not: vitest run は mode=test で動くため、Vite のデフォルトでは .env.test* しか読まれない。
// Beer Salon では Supabase 接続情報を .env.local に集約しているため、明示的に読み込む。
// (apps/web/.env.local に NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL が定義済み)
loadDotenv({ path: resolve(__dirname, ".env.local") });

// Why not: UT 側 (vitest.config.ts) と 1 ファイルにまとめて projects 構成にすることも検討したが、
// jsdom 環境を引き継ぐと Prisma + Supabase が動かない・globalSetup が衝突するため別 config に分離。
export default defineConfig({
	test: {
		environment: "node",
		include: ["**/*.integration.test.ts"],
		exclude: ["node_modules", ".next", "e2e"],
		globalSetup: ["./src/test/integration-setup.ts"],
		testTimeout: 30_000,
		hookTimeout: 30_000,
		globals: true,
		// Why not: 並列実行すると `it-` 接頭辞で一意化していてもクリーンアップ間の競合が
		// 出るケースがあるため、まずは 1 プロセスで直列化する。後続 PR でテストが増えたら見直す。
		fileParallelism: false,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
