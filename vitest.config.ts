import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		globals: true,
		exclude: ["node_modules", "e2e", ".next"],
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
