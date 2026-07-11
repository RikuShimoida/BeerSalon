import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
			updateUser: mockUpdateUser,
			signOut: mockSignOut,
		},
	})),
}));

import { resetPasswordAction } from "./actions";

describe("resetPasswordAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-id" } },
			error: null,
		});
		mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });
		mockSignOut.mockResolvedValue({ error: null });
	});

	describe("正常系", () => {
		it("有効なパスワードでupdateUserとsignOutが呼ばれる", async () => {
			const formData = new FormData();
			formData.append("password", "NewPass1!");
			formData.append("confirmPassword", "NewPass1!");

			try {
				await resetPasswordAction(undefined, formData);
			} catch (_error) {
				// redirectでthrowされる
			}

			expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewPass1!" });
			expect(mockSignOut).toHaveBeenCalled();
			expect(mockRedirect).toHaveBeenCalledWith("/login?reset=success");
		});

		it("記号を含まないパスワードでもupdateUserが呼ばれる", async () => {
			const formData = new FormData();
			formData.append("password", "Password1234");
			formData.append("confirmPassword", "Password1234");

			try {
				await resetPasswordAction(undefined, formData);
			} catch (_error) {
				// redirectでthrowされる
			}

			expect(mockUpdateUser).toHaveBeenCalledWith({ password: "Password1234" });
			expect(mockSignOut).toHaveBeenCalled();
			expect(mockRedirect).toHaveBeenCalledWith("/login?reset=success");
		});
	});

	describe("異常系 - バリデーション", () => {
		it("パスワードが8文字未満の場合、エラーが返る", async () => {
			const formData = new FormData();
			formData.append("password", "Aa1!");
			formData.append("confirmPassword", "Aa1!");

			const result = await resetPasswordAction(undefined, formData);

			expect(result?.error).toContain("パスワードは8文字以上");
			expect(mockUpdateUser).not.toHaveBeenCalled();
		});

		it("confirmPasswordが一致しない場合、エラーが返る", async () => {
			const formData = new FormData();
			formData.append("password", "NewPass1!");
			formData.append("confirmPassword", "Other123!");

			const result = await resetPasswordAction(undefined, formData);

			expect(result).toEqual({ error: "パスワードが一致しません" });
			expect(mockUpdateUser).not.toHaveBeenCalled();
		});
	});

	describe("異常系 - セッション", () => {
		it("recoveryセッションが無い場合、/password/forgot?error=session_expiredへリダイレクトされる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: null },
				error: null,
			});

			const formData = new FormData();
			formData.append("password", "NewPass1!");
			formData.append("confirmPassword", "NewPass1!");

			try {
				await resetPasswordAction(undefined, formData);
			} catch (_error) {
				// redirectでthrowされる
			}

			expect(mockRedirect).toHaveBeenCalledWith(
				"/password/forgot?error=session_expired",
			);
			expect(mockUpdateUser).not.toHaveBeenCalled();
		});
	});

	describe("異常系 - Supabaseエラー", () => {
		it("updateUserがエラーを返した場合、エラーメッセージが返る", async () => {
			mockUpdateUser.mockResolvedValue({
				data: null,
				error: { message: "Update failed" },
			});

			const formData = new FormData();
			formData.append("password", "NewPass1!");
			formData.append("confirmPassword", "NewPass1!");

			const result = await resetPasswordAction(undefined, formData);

			expect(result).toEqual({
				error: "パスワードの更新に失敗しました。もう一度お試しください。",
			});
			expect(mockSignOut).not.toHaveBeenCalled();
			expect(mockRedirect).not.toHaveBeenCalled();
		});
	});
});
