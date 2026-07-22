import { describe, expect, it } from "vitest";
import {
	buildDirectionsUrls,
	type DirectionsTarget,
	hasDirectionsTarget,
} from "./directions-url";

function makeTarget(
	overrides: Partial<DirectionsTarget> = {},
): DirectionsTarget {
	return {
		prefecture: "静岡県",
		city: "静岡市葵区",
		addressLine1: "追手町1-1",
		addressLine2: null,
		latitude: "34.9756",
		longitude: "138.3833",
		...overrides,
	};
}

describe("buildDirectionsUrls", () => {
	it("緯度経度が有効なとき、Apple/Google 両 URL に座標が目的地として入る", () => {
		const urls = buildDirectionsUrls(
			makeTarget({ latitude: "35.1614", longitude: "138.6764" }),
		);

		expect(urls.apple).toBe("https://maps.apple.com/?daddr=35.1614%2C138.6764");
		expect(urls.google).toBe(
			"https://www.google.com/maps/dir/?api=1&destination=35.1614%2C138.6764",
		);
	});

	it("緯度経度が null のとき、住所文字列にフォールバックする", () => {
		const urls = buildDirectionsUrls(
			makeTarget({
				latitude: null,
				longitude: null,
				prefecture: "東京都",
				city: "渋谷区",
				addressLine1: "道玄坂1-2-3",
			}),
		);

		const expected = encodeURIComponent("東京都渋谷区道玄坂1-2-3");
		expect(urls.apple).toBe(`https://maps.apple.com/?daddr=${expected}`);
		expect(urls.google).toBe(
			`https://www.google.com/maps/dir/?api=1&destination=${expected}`,
		);
	});

	it("緯度経度が空文字のとき、座標0扱いを避けて住所にフォールバックする", () => {
		const urls = buildDirectionsUrls(
			makeTarget({ latitude: "", longitude: "" }),
		);

		const expected = encodeURIComponent("静岡県静岡市葵区追手町1-1");
		expect(urls.apple).toContain(`daddr=${expected}`);
		expect(urls.google).toContain(`destination=${expected}`);
	});

	it("緯度経度が数値に変換できないとき、住所にフォールバックする", () => {
		const urls = buildDirectionsUrls(
			makeTarget({ latitude: "abc", longitude: "xyz" }),
		);

		const expected = encodeURIComponent("静岡県静岡市葵区追手町1-1");
		expect(urls.google).toContain(`destination=${expected}`);
	});

	it("addressLine2 があるとき、住所に半角スペース区切りで連結される", () => {
		const urls = buildDirectionsUrls(
			makeTarget({
				latitude: null,
				longitude: null,
				addressLine2: "ビール会館2F",
			}),
		);

		const expected = encodeURIComponent(
			"静岡県静岡市葵区追手町1-1 ビール会館2F",
		);
		expect(urls.google).toContain(`destination=${expected}`);
	});

	it("座標のみ片方が有効でないとき、座標を採用せず住所にフォールバックする", () => {
		const urls = buildDirectionsUrls(
			makeTarget({ latitude: "35.1614", longitude: null }),
		);

		const expected = encodeURIComponent("静岡県静岡市葵区追手町1-1");
		expect(urls.google).toContain(`destination=${expected}`);
	});
});

describe("hasDirectionsTarget", () => {
	it("有効な座標を持つとき true を返す", () => {
		expect(
			hasDirectionsTarget(makeTarget({ latitude: "35.1", longitude: "138.6" })),
		).toBe(true);
	});

	it("座標未登録でも住所があれば true を返す", () => {
		expect(
			hasDirectionsTarget(makeTarget({ latitude: null, longitude: null })),
		).toBe(true);
	});

	it("座標も住所も無いとき false を返す（導線非表示）", () => {
		expect(
			hasDirectionsTarget({
				prefecture: "",
				city: "",
				addressLine1: "",
				addressLine2: null,
				latitude: null,
				longitude: null,
			}),
		).toBe(false);
	});
});
