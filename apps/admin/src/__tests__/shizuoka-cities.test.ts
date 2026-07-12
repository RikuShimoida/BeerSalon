import { SHIZUOKA_MUNICIPALITIES as SHARED_MUNICIPALITIES } from "@beersalon/shared";
import { describe, expect, it } from "vitest";
import {
	SHIZUOKA_MUNICIPALITIES,
	SHIZUOKA_PREFECTURE,
} from "@/lib/shizuoka-cities";

describe("管理画面の市町村マスタ（Issue #419）", () => {
	it("shared マスタを再エクスポートしており内容が一致する（乖離再発防止）", () => {
		expect([...SHIZUOKA_MUNICIPALITIES]).toEqual([...SHARED_MUNICIPALITIES]);
	});

	it("都道府県は静岡県", () => {
		expect(SHIZUOKA_PREFECTURE).toBe("静岡県");
	});

	// admin が保存する bars.city の粒度。区付きで保存されると
	// ユーザー画面の区なしフィルターと一致しなくなる。
	it("政令市を区なし粒度で持つ", () => {
		expect(SHIZUOKA_MUNICIPALITIES).toContain("静岡市");
		expect(SHIZUOKA_MUNICIPALITIES).toContain("浜松市");
		const hasWard = SHIZUOKA_MUNICIPALITIES.some((name) => name.includes("（"));
		expect(hasWard).toBe(false);
	});
});
