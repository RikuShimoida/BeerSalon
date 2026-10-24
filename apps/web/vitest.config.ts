import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		globals: true,
		exclude: ["node_modules", "e2e", ".next", "**/*.integration.test.ts"],
		// Why not 実行環境の TZ に任せるか: 日時表示を検証するテストがあるため、
		// 開発者のマシン（JST）と CI（UTC）で結果が変わり CI だけ落ちる。
		env: {
			TZ: "Asia/Tokyo",
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			exclude: [
				"node_modules/",
				"e2e/",
				".next/",
				"src/generated/",
				"src/test/",
				"**/*.config.ts",
				"**/*.config.js",
				"**/*.test.ts",
				"**/*.test.tsx",
				"**/*.spec.ts",
				"**/*.spec.tsx",
			],
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
