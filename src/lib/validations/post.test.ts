import { describe, expect, it } from "vitest";
import { createPostSchema } from "./post";

describe("createPostSchema", () => {
	describe("正常系", () => {
		it("有効な店舗IDと本文でバリデーションが成功する", () => {
			const validData = {
				barId: "1",
				body: "美味しいビールでした！",
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.barId).toBe(BigInt(1));
				expect(result.data.body).toBe("美味しいビールでした！");
				expect(result.data.images).toEqual([]);
			}
		});

		it("画像を含む投稿データでバリデーションが成功する", () => {
			const image1 = new File(["image1"], "test1.jpg", { type: "image/jpeg" });
			const image2 = new File(["image2"], "test2.jpg", { type: "image/jpeg" });

			const validData = {
				barId: "123",
				body: "クラフトビールが最高でした！",
				images: [image1, image2],
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.barId).toBe(BigInt(123));
				expect(result.data.body).toBe("クラフトビールが最高でした！");
				expect(result.data.images).toHaveLength(2);
				expect(result.data.images[0]).toBeInstanceOf(File);
				expect(result.data.images[1]).toBeInstanceOf(File);
			}
		});
	});

	describe("異常系 - 店舗ID", () => {
		it("店舗IDが空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				barId: "",
				body: "美味しいビールでした！",
			};

			const result = createPostSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("店舗を選択してください");
			}
		});
	});

	describe("異常系 - 本文", () => {
		it("本文が空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				barId: "1",
				body: "",
			};

			const result = createPostSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"投稿本文を入力してください",
				);
			}
		});
	});

	describe("異常系 - 画像", () => {
		it("画像が5枚以上の場合、エラーメッセージが返される", () => {
			const images = Array.from({ length: 5 }, (_, i) => {
				return new File([`image${i}`], `test${i}.jpg`, {
					type: "image/jpeg",
				});
			});

			const invalidData = {
				barId: "1",
				body: "美味しいビールでした！",
				images: images,
			};

			const result = createPostSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("写真は最大4枚までです");
			}
		});
	});

	describe("境界値テスト", () => {
		it("画像がちょうど4枚の場合、バリデーションが成功する", () => {
			const images = Array.from({ length: 4 }, (_, i) => {
				return new File([`image${i}`], `test${i}.jpg`, {
					type: "image/jpeg",
				});
			});

			const validData = {
				barId: "1",
				body: "美味しいビールでした！",
				images: images,
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.images).toHaveLength(4);
			}
		});

		it("画像が1枚の場合、バリデーションが成功する", () => {
			const image = new File(["image"], "test.jpg", { type: "image/jpeg" });

			const validData = {
				barId: "1",
				body: "美味しいビールでした！",
				images: [image],
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.images).toHaveLength(1);
			}
		});

		it("本文が1文字の場合、バリデーションが成功する", () => {
			const validData = {
				barId: "1",
				body: "◯",
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});

		it("店舗IDが大きな数値の文字列の場合、BigIntに変換される", () => {
			const validData = {
				barId: "9007199254740991",
				body: "美味しいビールでした！",
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.barId).toBe(BigInt("9007199254740991"));
			}
		});
	});

	describe("エッジケース", () => {
		it("imagesプロパティが未定義の場合、空配列がデフォルト値として設定される", () => {
			const validData = {
				barId: "1",
				body: "美味しいビールでした！",
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.images).toEqual([]);
			}
		});

		it("本文に特殊文字が含まれる場合でもバリデーションが成功する", () => {
			const validData = {
				barId: "1",
				body: "美味しい！🍺✨\n改行も含む\tタブも含む",
			};

			const result = createPostSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.body).toBe("美味しい！🍺✨\n改行も含む\tタブも含む");
			}
		});
	});
});
