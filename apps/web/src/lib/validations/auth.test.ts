import { describe, expect, it } from "vitest";
import { loginSchema, profileSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
	describe("正常系", () => {
		it("有効なメールアドレスとパスワードでバリデーションが成功する", () => {
			const validData = {
				email: "test@example.com",
				password: "Test1234!",
			};

			const result = signUpSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.email).toBe("test@example.com");
				expect(result.data.password).toBe("Test1234!");
			}
		});
	});

	describe("異常系 - メールアドレス", () => {
		it("メールアドレスが空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "",
				password: "Test1234!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"メールアドレスを入力してください",
				);
			}
		});

		it("メールアドレスの形式が不正な場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "invalid-email",
				password: "Test1234!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"有効なメールアドレスを入力してください",
				);
			}
		});

		it("@が含まれていないメールアドレスの場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "testexample.com",
				password: "Test1234!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"有効なメールアドレスを入力してください",
				);
			}
		});
	});

	describe("異常系 - パスワード", () => {
		it("パスワードが8文字未満の場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "test@example.com",
				password: "Test12!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				const errors = result.error.issues.map((e) => e.message);
				expect(errors).toContain("パスワードは8文字以上で入力してください");
			}
		});

		it("パスワードに小文字が含まれていない場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "test@example.com",
				password: "TEST1234!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				const errors = result.error.issues.map((e) => e.message);
				expect(errors).toContain("パスワードには小文字を含めてください");
			}
		});

		it("パスワードに大文字が含まれていない場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "test@example.com",
				password: "test1234!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				const errors = result.error.issues.map((e) => e.message);
				expect(errors).toContain("パスワードには大文字を含めてください");
			}
		});

		it("パスワードに数字が含まれていない場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "test@example.com",
				password: "TestTest!",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				const errors = result.error.issues.map((e) => e.message);
				expect(errors).toContain("パスワードには数字を含めてください");
			}
		});

		it("パスワードに記号が含まれていない場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "test@example.com",
				password: "Test1234",
			};

			const result = signUpSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				const errors = result.error.issues.map((e) => e.message);
				expect(errors).toContain("パスワードには記号を含めてください");
			}
		});
	});

	describe("境界値テスト", () => {
		it("パスワードがちょうど8文字の有効なパスワードの場合、バリデーションが成功する", () => {
			const validData = {
				email: "test@example.com",
				password: "Test123!",
			};

			const result = signUpSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});
	});
});

describe("loginSchema", () => {
	describe("正常系", () => {
		it("有効なメールアドレスとパスワードでバリデーションが成功する", () => {
			const validData = {
				email: "test@example.com",
				password: "anypassword",
			};

			const result = loginSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.email).toBe("test@example.com");
				expect(result.data.password).toBe("anypassword");
			}
		});
	});

	describe("異常系", () => {
		it("メールアドレスが空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "",
				password: "password",
			};

			const result = loginSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"メールアドレスを入力してください",
				);
			}
		});

		it("メールアドレスの形式が不正な場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "invalid-email",
				password: "password",
			};

			const result = loginSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"有効なメールアドレスを入力してください",
				);
			}
		});

		it("パスワードが空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				email: "test@example.com",
				password: "",
			};

			const result = loginSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"パスワードを入力してください",
				);
			}
		});
	});
});

describe("profileSchema", () => {
	describe("正常系", () => {
		it("全ての必須項目が入力されている場合、バリデーションが成功する", () => {
			const validData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
			};

			const result = profileSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.lastName).toBe("山田");
				expect(result.data.firstName).toBe("太郎");
				expect(result.data.nickname).toBe("やまちゃん");
				expect(result.data.birthday).toBe("1990-01-01");
				expect(result.data.gender).toBe("male");
				expect(result.data.prefecture).toBe("東京都");
			}
		});

		it("オプション項目も含めて全て入力されている場合、バリデーションが成功する", () => {
			const validData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "https://example.com/image.jpg",
				bio: "クラフトビール好きです",
			};

			const result = profileSchema.safeParse(validData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.profileImageUrl).toBe(
					"https://example.com/image.jpg",
				);
				expect(result.data.bio).toBe("クラフトビール好きです");
			}
		});
	});

	describe("異常系 - 必須項目", () => {
		it("姓が空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				lastName: "",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("姓を入力してください");
			}
		});

		it("名が空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				lastName: "山田",
				firstName: "",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("名を入力してください");
			}
		});

		it("ニックネームが空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ニックネームを入力してください",
				);
			}
		});

		it("生年月日が空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "",
				gender: "male",
				prefecture: "東京都",
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"生年月日を選択してください",
				);
			}
		});

		it("性別が空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "",
				prefecture: "東京都",
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("性別を選択してください");
			}
		});

		it("都道府県が空文字の場合、エラーメッセージが返される", () => {
			const invalidData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "",
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"都道府県を選択してください",
				);
			}
		});
	});

	describe("異常系 - オプション項目の文字数制限", () => {
		it("プロフィール文が500文字を超える場合、エラーメッセージが返される", () => {
			const longBio = "あ".repeat(501);
			const invalidData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				bio: longBio,
			};

			const result = profileSchema.safeParse(invalidData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"プロフィール文は500文字以内で入力してください",
				);
			}
		});
	});

	describe("境界値テスト", () => {
		it("プロフィール文がちょうど500文字の場合、バリデーションが成功する", () => {
			const exactBio = "あ".repeat(500);
			const validData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				bio: exactBio,
			};

			const result = profileSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});

		it("プロフィール文が1文字の場合、バリデーションが成功する", () => {
			const validData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				bio: "あ",
			};

			const result = profileSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});

		it("プロフィール文が空文字列の場合、バリデーションが成功する", () => {
			const validData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				bio: "",
			};

			const result = profileSchema.safeParse(validData);

			expect(result.success).toBe(true);
		});
	});
});
