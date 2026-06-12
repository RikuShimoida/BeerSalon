import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "vitest/config";

// Why not: vitest run は mode=test で動くため、Vite のデフォルトでは .env.test* しか読まれない。
// .env.local に集約された Supabase 接続情報を明示的にロードする。
loadDotenv({ path: resolve(__dirname, ".env.local") });

// Why not: admin 側でも UT と Integration を別 config に分離。
// 現時点では Integration テスト本体は追加しないが、PR2 以降で追加可能な土台を用意する。
export default defineConfig({
	test: {
		environment: "node",
		include: ["**/*.integration.test.ts"],
		exclude: ["node_modules", ".next", "tests"],
		globalSetup: ["./src/test/integration-setup.ts"],
		testTimeout: 30_000,
		hookTimeout: 30_000,
		globals: true,
		fileParallelism: false,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
