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
				origins: [],
			});
		});

		it("cat と origin をそれぞれカンマ区切りで配列に変換する", () => {
			const params = new URLSearchParams(
				"q=IPA&city=静岡市&cat=IPA,スタウト&origin=日本/静岡,アメリカ/カリフォルニア",
			);

			expect(parseSearchParams(params)).toEqual({
				q: "IPA",
				city: "静岡市",
				categories: ["IPA", "スタウト"],
				origins: ["日本/静岡", "アメリカ/カリフォルニア"],
			});
		});

		it("origin 単一値も要素1つの配列に変換する", () => {
			const params = new URLSearchParams("origin=日本/静岡");

			expect(parseSearchParams(params).origins).toEqual(["日本/静岡"]);
		});

		it("cat の各要素の前後空白はトリムされ、空要素は除外される", () => {
			const params = new URLSearchParams("cat=%20IPA%20,,%20スタウト%20");

			expect(parseSearchParams(params).categories).toEqual(["IPA", "スタウト"]);
		});

		it("origin の各要素の前後空白はトリムされ、空要素は除外される。国/地域のスラッシュは保持される", () => {
			const params = new URLSearchParams(
				"origin=%20日本/静岡%20,,%20アメリカ/カリフォルニア%20",
			);

			expect(parseSearchParams(params).origins).toEqual([
				"日本/静岡",
				"アメリカ/カリフォルニア",
			]);
		});

		it("q のみ指定された場合は city は空文字になる", () => {
			const params = new URLSearchParams("q=スタウト");

			expect(parseSearchParams(params)).toEqual({
				q: "スタウト",
				city: "",
				categories: [],
				origins: [],
			});
		});

		it("city のみ指定された場合は q は空文字になる", () => {
			const params = new URLSearchParams("city=浜松市");

			expect(parseSearchParams(params)).toEqual({
				q: "",
				city: "浜松市",
				categories: [],
				origins: [],
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
				origins: [],
			});
		});

		it("null が渡された場合もすべて空になる", () => {
			expect(parseSearchParams(null)).toEqual({
				q: "",
				city: "",
				categories: [],
				origins: [],
			});
		});

		it("undefined が渡された場合もすべて空になる", () => {
			expect(parseSearchParams(undefined)).toEqual({
				q: "",
				city: "",
				categories: [],
				origins: [],
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

		it("categories と origins をそれぞれカンマ区切りで格納する", () => {
			const result = buildSearchQueryString({
				categories: ["IPA", "スタウト"],
				origins: ["日本/静岡", "アメリカ/カリフォルニア"],
			});
			const params = new URLSearchParams(result);

			expect(params.get("cat")).toBe("IPA,スタウト");
			expect(params.get("origin")).toBe("日本/静岡,アメリカ/カリフォルニア");
		});

		it("categories が空配列の場合は cat を含めない", () => {
			const result = buildSearchQueryString({ q: "IPA", categories: [] });
			const params = new URLSearchParams(result);

			expect(params.has("cat")).toBe(false);
		});

		it("origins が空配列の場合は origin を含めない", () => {
			const result = buildSearchQueryString({ q: "IPA", origins: [] });
			const params = new URLSearchParams(result);

			expect(params.has("origin")).toBe(false);
		});

		it("categories の空要素・空白のみ要素は除外される", () => {
			const result = buildSearchQueryString({
				categories: [" IPA ", "", "  "],
			});
			const params = new URLSearchParams(result);

			expect(params.get("cat")).toBe("IPA");
		});

		it("origins の空要素・空白のみ要素は除外される", () => {
			const result = buildSearchQueryString({
				origins: [" 日本/静岡 ", "", "  "],
			});
			const params = new URLSearchParams(result);

			expect(params.get("origin")).toBe("日本/静岡");
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
				categories: ["IPA", "スタウト"],
				origins: ["日本/静岡", "アメリカ/カリフォルニア"],
			});
			const parsed = parseSearchParams(new URLSearchParams(queryString));

			expect(parsed.q).toBe("IPA");
			expect(parsed.city).toBe("静岡市");
			expect(parsed.categories).toEqual(["IPA", "スタウト"]);
			expect(parsed.origins).toEqual(["日本/静岡", "アメリカ/カリフォルニア"]);
		});
	});
});
