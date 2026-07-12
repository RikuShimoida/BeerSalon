import { describe, expect, it } from "vitest";
import type { BarPin } from "./bar-pins";
import { resolveMapView } from "./map-view";

function makePin(overrides: Partial<BarPin>): BarPin {
	return {
		id: "1",
		name: "テストバー",
		city: "静岡市",
		prefecture: "静岡県",
		lat: 34.9756,
		lng: 138.3833,
		...overrides,
	};
}

describe("resolveMapView", () => {
	it("ピン0件のときは何もしない（type: none）", () => {
		expect(resolveMapView([])).toEqual({ type: "none" });
	});

	it("ピン1件のときはそのピンを中心にする（type: center）", () => {
		const view = resolveMapView([
			makePin({ id: "10", lat: 35.1614, lng: 138.6764 }),
		]);
		expect(view).toEqual({
			type: "center",
			center: { lat: 35.1614, lng: 138.6764 },
		});
	});

	it("ピン2件以上のときは全ピンを内包する fitBounds 対象を返す（type: fit）", () => {
		const view = resolveMapView([
			makePin({ id: "1", lat: 34.9756, lng: 138.3833 }),
			makePin({ id: "2", lat: 35.1614, lng: 138.6764 }),
		]);
		expect(view).toEqual({
			type: "fit",
			points: [
				{ lat: 34.9756, lng: 138.3833 },
				{ lat: 35.1614, lng: 138.6764 },
			],
		});
	});

	it("同一座標のピンが2件でも一意に畳み込んで center にする（type: center）", () => {
		const view = resolveMapView([
			makePin({ id: "1", lat: 34.9756, lng: 138.3833 }),
			makePin({ id: "2", lat: 34.9756, lng: 138.3833 }),
		]);
		expect(view).toEqual({
			type: "center",
			center: { lat: 34.9756, lng: 138.3833 },
		});
	});

	it("1件→2件の境界: 2件目が加わると center から fit に切り替わる", () => {
		const one = resolveMapView([makePin({ id: "1" })]);
		expect(one.type).toBe("center");

		const two = resolveMapView([
			makePin({ id: "1", lat: 34.9756, lng: 138.3833 }),
			makePin({ id: "2", lat: 35.0, lng: 138.5 }),
		]);
		expect(two.type).toBe("fit");
		expect(two.type === "fit" && two.points).toHaveLength(2);
	});

	it("多数のピンをすべて fitBounds 対象点として返す", () => {
		const pins = [
			makePin({ id: "1", lat: 34.9, lng: 138.3 }),
			makePin({ id: "2", lat: 35.1, lng: 138.6 }),
			makePin({ id: "3", lat: 35.3, lng: 139.0 }),
		];
		const view = resolveMapView(pins);
		expect(view.type).toBe("fit");
		expect(view.type === "fit" && view.points).toEqual([
			{ lat: 34.9, lng: 138.3 },
			{ lat: 35.1, lng: 138.6 },
			{ lat: 35.3, lng: 139.0 },
		]);
	});
});
