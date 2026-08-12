import { defineConfig } from "vitest/config";

// scripts/ 配下の開発ツール（未使用 API 検出など）専用の Vitest 設定。
// アプリのビルド対象ではないため、workspace の vitest とは分離して回す。
export default defineConfig({
	test: {
		include: ["scripts/**/*.test.mjs"],
	},
});
