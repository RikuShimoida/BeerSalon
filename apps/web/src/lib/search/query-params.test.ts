import { describe, expect, it } from "vitest";
import { buildSearchQueryString, parseSearchParams } from "./query-params";

describe("parseSearchParams", () => {
	describe("正常系", () => {
		it("q と city を読み取って検索状態に変換する", () => {
			const params = new URLSearchParams("q=IPA&city=静岡市");

			expect(parseSearchParams(params)).toEqual({
				q: "IPA",
				city: "静岡市",
				categories: [],
				origin: "",
			});
		});

		it("q のみ指定された場合は city は空文字になる", () => {
			const params = new URLSearchParams("q=スタウト");

			expect(parseSearchParams(params)).toEqual({
				q: "スタウト",
				city: "",
				categories: [],
				origin: "",
			});
		});

		it("city のみ指定された場合は q は空文字になる", () => {
			const params = new URLSearchParams("city=浜松市");

			expect(parseSearchParams(params)).toEqual({
				q: "",
				city: "浜松市",
				categories: [],
				origin: "",
			});
		});
	});

	describe("正規化", () => {
		it("前後の空白はトリムされる", () => {
			const params = new URLSearchParams("q=%20%20IPA%20%20&city=%20静岡市%20");

			const result = parseSearchParams(params);
			expect(result.q).toBe("IPA");
			expect(result.city).toBe("静岡市");
		});

		it("空白のみの値は空文字に正規化される", () => {
			const params = new URLSearchParams("q=%20%20&city=%20");

			const result = parseSearchParams(params);
			expect(result.q).toBe("");
			expect(result.city).toBe("");
		});
	});

	describe("境界値・異常系", () => {
		it("パラメータが空の場合はすべて空になる", () => {
			expect(parseSearchParams(new URLSearchParams())).toEqual({
				q: "",
				city: "",
				categories: [],
				origin: "",
			});
		});

		it("null が渡された場合もすべて空になる", () => {
			expect(parseSearchParams(null)).toEqual({
				q: "",
				city: "",
				categories: [],
				origin: "",
			});
		});

		it("undefined が渡された場合もすべて空になる", () => {
			expect(parseSearchParams(undefined)).toEqual({
				q: "",
				city: "",
				categories: [],
				origin: "",
			});
		});
	});
});

describe("buildSearchQueryString", () => {
	describe("正常系", () => {
		it("q と city の両方を含むクエリ文字列を生成する", () => {
			const result = buildSearchQueryString({ q: "IPA", city: "静岡市" });
			const params = new URLSearchParams(result);

			expect(params.get("q")).toBe("IPA");
			expect(params.get("city")).toBe("静岡市");
		});

		it("q のみ指定された場合は city を含めない", () => {
			const result = buildSearchQueryString({ q: "IPA", city: "" });
			const params = new URLSearchParams(result);

			expect(params.get("q")).toBe("IPA");
			expect(params.has("city")).toBe(false);
		});

		it("city のみ指定された場合は q を含めない", () => {
			const result = buildSearchQueryString({ q: "", city: "浜松市" });
			const params = new URLSearchParams(result);

			expect(params.has("q")).toBe(false);
			expect(params.get("city")).toBe("浜松市");
		});
	});

	describe("正規化", () => {
		it("前後の空白はトリムされてから格納される", () => {
			const result = buildSearchQueryString({
				q: "  IPA  ",
				city: "  静岡市 ",
			});
			const params = new URLSearchParams(result);

			expect(params.get("q")).toBe("IPA");
			expect(params.get("city")).toBe("静岡市");
		});

		it("空白のみの値はクエリに含めない", () => {
			const result = buildSearchQueryString({ q: "   ", city: "  " });

			expect(result).toBe("");
		});
	});

	describe("境界値・異常系", () => {
		it("すべて空の場合は空文字を返す", () => {
			expect(buildSearchQueryString({ q: "", city: "" })).toBe("");
		});

		it("引数が省略された場合は空文字を返す", () => {
			expect(buildSearchQueryString({})).toBe("");
		});
	});

	describe("ラウンドトリップ", () => {
		it("build した結果を parse すると元の正規化済み値に戻る", () => {
			const queryString = buildSearchQueryString({
				q: " IPA ",
				city: "静岡市",
			});
			const parsed = parseSearchParams(new URLSearchParams(queryString));

			expect(parsed.q).toBe("IPA");
			expect(parsed.city).toBe("静岡市");
		});
	});
});
