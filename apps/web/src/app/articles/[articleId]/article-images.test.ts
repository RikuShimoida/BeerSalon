import { describe, expect, it } from "vitest";
import { getArticleImageUrls } from "./article-images";

describe("getArticleImageUrls", () => {
	describe("正常系", () => {
		it("3枚すべて設定されている場合、3件を順序通り返す", () => {
			const result = getArticleImageUrls({
				imageUrl: "https://example.com/1.jpg",
				imageUrl2: "https://example.com/2.jpg",
				imageUrl3: "https://example.com/3.jpg",
			});
			expect(result).toEqual([
				"https://example.com/1.jpg",
				"https://example.com/2.jpg",
				"https://example.com/3.jpg",
			]);
		});

		it("1枚目のみ設定されている場合、1件を返す", () => {
			const result = getArticleImageUrls({
				imageUrl: "https://example.com/1.jpg",
				imageUrl2: null,
				imageUrl3: null,
			});
			expect(result).toEqual(["https://example.com/1.jpg"]);
		});
	});

	describe("null を含む境界・異常系", () => {
		it("2枚目のみ null の場合、imageUrl と imageUrl3 の2件を順序通り返す", () => {
			const result = getArticleImageUrls({
				imageUrl: "https://example.com/1.jpg",
				imageUrl2: null,
				imageUrl3: "https://example.com/3.jpg",
			});
			expect(result).toEqual([
				"https://example.com/1.jpg",
				"https://example.com/3.jpg",
			]);
		});

		it("1枚目が null で 2・3枚目のみ設定の場合、2件を返す", () => {
			const result = getArticleImageUrls({
				imageUrl: null,
				imageUrl2: "https://example.com/2.jpg",
				imageUrl3: "https://example.com/3.jpg",
			});
			expect(result).toEqual([
				"https://example.com/2.jpg",
				"https://example.com/3.jpg",
			]);
		});

		it("すべて null の場合、空配列を返す", () => {
			const result = getArticleImageUrls({
				imageUrl: null,
				imageUrl2: null,
				imageUrl3: null,
			});
			expect(result).toEqual([]);
		});

		it("空文字列は表示対象から除外する", () => {
			const result = getArticleImageUrls({
				imageUrl: "",
				imageUrl2: "https://example.com/2.jpg",
				imageUrl3: "",
			});
			expect(result).toEqual(["https://example.com/2.jpg"]);
		});
	});
});
