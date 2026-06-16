import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResetPasswordForEmail = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			resetPasswordForEmail: mockResetPasswordForEmail,
		},
	})),
}));

import { forgotPasswordAction } from "./actions";

describe("forgotPasswordAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockResetPasswordForEmail.mockResolvedValue({
			data: {},
			error: null,
		});
	});

	describe("正常系", () => {
		it("有効なメールアドレスで送信が成功し、success: trueが返る", async () => {
			const formData = new FormData();
			formData.append("email", "user@example.com");

			const result = await forgotPasswordAction(undefined, formData);

			expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
				"user@example.com",
				{
					redirectTo: expect.stringContaining(
						"/auth/callback?next=/password/reset",
					),
				},
			);
			expect(result).toEqual({
				success: true,
				message: "該当アドレスが登録されていればメールを送信しました",
			});
		});

		it("Supabaseがエラーを返しても、ユーザー列挙を防ぐためsuccess: trueで返る", async () => {
			mockResetPasswordForEmail.mockResolvedValue({
				data: null,
				error: { message: "User not found" },
			});

			const formData = new FormData();
			formData.append("email", "unknown@example.com");

			const result = await forgotPasswordAction(undefined, formData);

			expect(result).toEqual({
				success: true,
				message: "該当アドレスが登録されていればメールを送信しました",
			});
		});
	});

	describe("異常系 - バリデーション", () => {
		it("メールアドレスが空の場合、エラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "");

			const result = await forgotPasswordAction(undefined, formData);

			expect(result).toEqual({
				success: false,
				error: "メールアドレスを入力してください",
			});
			expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
		});

		it("メール形式が不正な場合、エラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "not-an-email");

			const result = await forgotPasswordAction(undefined, formData);

			expect(result).toEqual({
				success: false,
				error: "有効なメールアドレスを入力してください",
			});
			expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
		});
	});
});
