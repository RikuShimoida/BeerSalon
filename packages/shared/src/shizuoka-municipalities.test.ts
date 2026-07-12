import { describe, expect, it } from "vitest";
import {
	SHIZUOKA_CITIES,
	SHIZUOKA_MUNICIPALITIES,
	SHIZUOKA_PREFECTURE,
	SHIZUOKA_TOWNS,
} from "./shizuoka-municipalities";

describe("SHIZUOKA_MUNICIPALITIES", () => {
	it("都道府県は静岡県", () => {
		expect(SHIZUOKA_PREFECTURE).toBe("静岡県");
	});

	it("市町村は市23 + 町12 = 35件で、市を先に町を後に並べる", () => {
		expect(SHIZUOKA_CITIES).toHaveLength(23);
		expect(SHIZUOKA_TOWNS).toHaveLength(12);
		expect(SHIZUOKA_MUNICIPALITIES).toHaveLength(35);
		expect(SHIZUOKA_MUNICIPALITIES).toEqual([
			...SHIZUOKA_CITIES,
			...SHIZUOKA_TOWNS,
		]);
	});

	it("政令市は区なし粒度（bars.city に一致する語彙）で持つ", () => {
		expect(SHIZUOKA_MUNICIPALITIES).toContain("静岡市");
		expect(SHIZUOKA_MUNICIPALITIES).toContain("浜松市");
	});

	// Issue #419: 区付き表記（「静岡市（葵区）」等）を混入させると
	// bars.city（区なし）と完全一致せず検索がヒットしなくなる。逆戻り防止。
	it("政令市を区付きで列挙しない", () => {
		const hasWard = SHIZUOKA_MUNICIPALITIES.some((name) => name.includes("（"));
		expect(hasWard).toBe(false);
	});

	it("マスタ内に重複がない", () => {
		expect(new Set(SHIZUOKA_MUNICIPALITIES).size).toBe(
			SHIZUOKA_MUNICIPALITIES.length,
		);
	});
});
