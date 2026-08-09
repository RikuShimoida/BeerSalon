import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		exclude: ["node_modules", "tests", ".next", "**/*.integration.test.ts"],
		// Why not 実行環境の TZ に任せるか: 日時のローカル変換を検証するテストがあるため、
		// 開発者のマシン（JST）と CI（UTC）で結果が変わり CI だけ落ちる。
		env: {
			TZ: "Asia/Tokyo",
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
