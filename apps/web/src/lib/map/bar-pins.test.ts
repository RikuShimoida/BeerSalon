import { describe, expect, it } from "vitest";
import type { BarSummary } from "@/components/bar/bar-summary";
import { toBarPins } from "./bar-pins";

function makeBar(overrides: Partial<BarSummary>): BarSummary {
	return {
		id: "1",
		name: "テストバー",
		prefecture: "静岡県",
		city: "静岡市（葵区）",
		imageUrl: undefined,
		latitude: "34.9756",
		longitude: "138.3833",
		...overrides,
	};
}

describe("toBarPins", () => {
	it("緯度経度を持つ店舗を number 型の position に変換してピン化する", () => {
		const pins = toBarPins([
			makeBar({ id: "10", latitude: "35.1614", longitude: "138.6764" }),
		]);

		expect(pins).toHaveLength(1);
		expect(pins[0]).toEqual({
			id: "10",
			name: "テストバー",
			city: "静岡市（葵区）",
			prefecture: "静岡県",
			lat: 35.1614,
			lng: 138.6764,
		});
		expect(typeof pins[0].lat).toBe("number");
		expect(typeof pins[0].lng).toBe("number");
	});

	it("latitude が null の店舗はピンから除外する", () => {
		const pins = toBarPins([
			makeBar({ id: "1", latitude: null, longitude: "138.3833" }),
		]);
		expect(pins).toHaveLength(0);
	});

	it("longitude が null の店舗はピンから除外する", () => {
		const pins = toBarPins([
			makeBar({ id: "1", latitude: "34.9756", longitude: null }),
		]);
		expect(pins).toHaveLength(0);
	});

	it("数値化できない緯度経度を持つ店舗はピンから除外する", () => {
		const pins = toBarPins([
			makeBar({ id: "1", latitude: "invalid", longitude: "138.3833" }),
		]);
		expect(pins).toHaveLength(0);
	});

	it("緯度経度あり/なしが混在しても、ありの店舗のみをピン化する", () => {
		const pins = toBarPins([
			makeBar({ id: "1", latitude: "34.9756", longitude: "138.3833" }),
			makeBar({ id: "2", latitude: null, longitude: null }),
			makeBar({ id: "3", latitude: "35.1614", longitude: "138.6764" }),
		]);

		expect(pins.map((pin) => pin.id)).toEqual(["1", "3"]);
	});

	it("空配列を渡すと空配列を返す", () => {
		expect(toBarPins([])).toEqual([]);
	});
});
