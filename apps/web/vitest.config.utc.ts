import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

/**
 * TZ=UTC でテストを実行するための設定。
 *
 * Why not `vitest.config.ts` の `TZ: "Asia/Tokyo"` を外すか: あの pin は開発者のマシン（JST）と
 * CI（UTC）で結果が変わり CI だけ落ちるのを防ぐために入っている。外すと既存の日時系テストが
 * 広範に落ちる。
 *
 * Why not 本番 TZ に合わせて UTC だけで実行するか: JST 固定のフォーマッタ・暦日ヘルパは
 * 「どの TZ でも同じ結果になる」ことが要件であり、片方の TZ だけで回しても TZ 依存の混入を
 * 検出できない。既定の JST 実行に対する追加の実行経路として使う（Issue #568）。
 */
export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			env: {
				TZ: "UTC",
			},
		},
	}),
);
