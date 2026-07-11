import { defineConfig } from "vitest/config";

// PoC 単体の Vitest 設定。ルートの turbo test には乗せず、この package 内で完結させる
//（共有 DB にも apps にも触れない完全隔離）。
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
