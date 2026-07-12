import { SHIZUOKA_MUNICIPALITIES } from "@beersalon/shared";
import { describe, expect, it } from "vitest";
import { SHIZUOKA_CITIES } from "./cities";
import { CITY_COORDINATES } from "./city-coordinates";

describe("ユーザー画面の市町村マスタ（Issue #419）", () => {
	it("市町村フィルターの選択肢は shared マスタと一致する（乖離再発防止）", () => {
		expect([...SHIZUOKA_CITIES]).toEqual([...SHIZUOKA_MUNICIPALITIES]);
	});

	it("フィルター選択肢に区付き表記（「静岡市（葵区）」等）を含まない", () => {
		const hasWard = SHIZUOKA_CITIES.some((name) => name.includes("（"));
		expect(hasWard).toBe(false);
	});

	it("政令市は区なしで選べる", () => {
		expect(SHIZUOKA_CITIES).toContain("静岡市");
		expect(SHIZUOKA_CITIES).toContain("浜松市");
	});

	// マップの中心座標はフィルター値（区なし）で引く。0件時に代表座標へ寄せるため、
	// すべてのフィルター選択肢に座標が存在しなければならない。
	it("全フィルター選択肢に代表座標が存在する", () => {
		for (const city of SHIZUOKA_CITIES) {
			expect(CITY_COORDINATES[city]).toBeDefined();
		}
	});

	it("代表座標マスタも区付きキーを持たない", () => {
		const hasWardKey = Object.keys(CITY_COORDINATES).some((key) =>
			key.includes("（"),
		);
		expect(hasWardKey).toBe(false);
	});
});
