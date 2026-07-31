import { describe, expect, it } from "vitest";
import {
	type BarProfileFields,
	createInitialOpeningHours,
	INITIAL_BAR_PROFILE_FIELDS,
	validateBarSnsUrls,
} from "@/lib/bar-form";

function makeFields(overrides: Partial<BarProfileFields>): BarProfileFields {
	return { ...INITIAL_BAR_PROFILE_FIELDS, ...overrides };
}

// 検証結果が不正であることをアサートしつつ error 文字列を取り出す。
// validateBarSnsUrls は判別可能ユニオンを返すため、error 参照前に isValid で narrow する。
function expectInvalidError(
	result: ReturnType<typeof validateBarSnsUrls>,
): string {
	expect(result.isValid).toBe(false);
	if (result.isValid) {
		throw new Error("valid な結果が返された（不正を期待）");
	}
	return result.error;
}

describe("validateBarSnsUrls", () => {
	it("全 URL 項目が空なら valid を返す", () => {
		expect(validateBarSnsUrls(INITIAL_BAR_PROFILE_FIELDS)).toEqual({
			isValid: true,
		});
	});

	it("正しい URL がすべて入っていれば valid を返す", () => {
		const fields = makeFields({
			website_url: "https://example.com",
			instagram_url: "https://www.instagram.com/your_account",
			x_url: "https://x.com/example",
			facebook_url: "https://www.facebook.com/yourpage",
			line_url: "https://line.me/R/ti/p/@example",
		});
		expect(validateBarSnsUrls(fields)).toEqual({ isValid: true });
	});

	it("website_url が不正なら website のエラーを返す", () => {
		const result = validateBarSnsUrls(makeFields({ website_url: "example" }));
		expect(expectInvalidError(result)).toContain("ホームページURL");
	});

	it("instagram_url が不正なら Instagram のエラーを返す", () => {
		const result = validateBarSnsUrls(
			makeFields({ instagram_url: "https://example.com" }),
		);
		expect(expectInvalidError(result)).toContain("Instagram");
	});

	it("x_url が不正なら X のエラーを返す", () => {
		const result = validateBarSnsUrls(
			makeFields({ x_url: "https://example.com" }),
		);
		expect(expectInvalidError(result)).toContain("X（Twitter）");
	});

	it("facebook_url が不正なら Facebook のエラーを返す", () => {
		const result = validateBarSnsUrls(
			makeFields({ facebook_url: "https://example.com" }),
		);
		expect(expectInvalidError(result)).toContain("Facebook");
	});

	it("line_url が不正なら LINE のエラーを返す", () => {
		const result = validateBarSnsUrls(
			makeFields({ line_url: "https://example.com" }),
		);
		expect(expectInvalidError(result)).toContain("LINE URL");
	});

	it("複数項目が不正な場合は検証順（website→instagram→x→facebook→line）の先頭のエラーを返す", () => {
		const result = validateBarSnsUrls(
			makeFields({
				website_url: "invalid-website",
				instagram_url: "https://example.com",
				line_url: "https://example.com",
			}),
		);
		// website が最優先で検証されるため、website のエラーが返る
		expect(expectInvalidError(result)).toContain("ホームページURL");
	});

	it("website が正常で instagram が不正なら instagram のエラーを返す（website をスキップして次へ進む）", () => {
		const result = validateBarSnsUrls(
			makeFields({
				website_url: "https://example.com",
				instagram_url: "https://example.com",
			}),
		);
		expect(expectInvalidError(result)).toContain("Instagram");
	});
});

describe("createInitialOpeningHours", () => {
	it("7 要素（日〜土）の配列を返す", () => {
		expect(createInitialOpeningHours()).toHaveLength(7);
	});

	it("各要素の day_of_week が 0〜6 で並ぶ", () => {
		const hours = createInitialOpeningHours();
		expect(hours.map((h) => h.day_of_week)).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	it("各要素が初期値（時刻空・sort_order 0・is_closed false）を持つ", () => {
		for (const hour of createInitialOpeningHours()) {
			expect(hour.open_time).toBe("");
			expect(hour.close_time).toBe("");
			expect(hour.sort_order).toBe(0);
			expect(hour.is_closed).toBe(false);
		}
	});

	it("呼び出しごとに独立した配列を返す（共有参照ではない）", () => {
		const a = createInitialOpeningHours();
		const b = createInitialOpeningHours();
		a[0].is_closed = true;
		expect(b[0].is_closed).toBe(false);
	});
});
