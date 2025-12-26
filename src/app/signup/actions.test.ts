import { beforeEach, describe, expect, it, vi } from "vitest";

// next/navigationのモック
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// Supabase clientのモック
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			signUp: mockSignUp,
		},
	})),
}));

import { signUp } from "./actions";

describe("signUp", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("有効なメール・パスワードで新規登録が成功し、エラーが返らない", async () => {
			mockSignUp.mockResolvedValue({
				data: {
					user: { id: "new-user-id" },
					session: null, // メール確認が必要な場合はsessionはnull
				},
				error: null,
			});

			const formData = new FormData();
			formData.append("email", "newuser@example.com");
			formData.append("password", "SecurePass1!");

			const result = await signUp(undefined, formData);

			expect(mockSignUp).toHaveBeenCalledWith({
				email: "newuser@example.com",
				password: "SecurePass1!",
				options: {
					emailRedirectTo: expect.stringMatching(
						/^http:\/\/(localhost|127\.0\.0\.1):3000\/signup\/profile$/,
					),
				},
			});
			expect(result).toBeUndefined();
		});

		it("成功時にredirect('/signup?success=true')が呼ばれる", async () => {
			mockSignUp.mockResolvedValue({
				data: {
					user: { id: "new-user-id" },
					session: null,
				},
				error: null,
			});

			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "ValidPass123!");

			try {
				await signUp(undefined, formData);
			} catch (_error) {
				// redirectは実際にはthrowするので、catchでモック呼び出しを確認
			}

			expect(mockRedirect).toHaveBeenCalledWith("/signup?success=true");
		});
	});

	describe("異常系 - バリデーションエラー", () => {
		it("メールアドレスが空の場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "");
			formData.append("password", "SecurePass1!");

			const result = await signUp(undefined, formData);

			expect(result).toEqual({
				error: "メールアドレスを入力してください",
			});
			expect(mockSignUp).not.toHaveBeenCalled();
		});

		it("メール形式が不正な場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "invalid-email");
			formData.append("password", "SecurePass1!");

			const result = await signUp(undefined, formData);

			expect(result).toEqual({
				error: "有効なメールアドレスを入力してください",
			});
			expect(mockSignUp).not.toHaveBeenCalled();
		});

		it("パスワードが8文字未満の場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "Short1!");

			const result = await signUp(undefined, formData);

			expect(result?.error).toContain("パスワードは8文字以上");
			expect(mockSignUp).not.toHaveBeenCalled();
		});

		it("パスワードに小文字が含まれていない場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "PASSWORD123!");

			const result = await signUp(undefined, formData);

			expect(result?.error).toContain("小文字");
			expect(mockSignUp).not.toHaveBeenCalled();
		});

		it("パスワードに大文字が含まれていない場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "password123!");

			const result = await signUp(undefined, formData);

			expect(result?.error).toContain("大文字");
			expect(mockSignUp).not.toHaveBeenCalled();
		});

		it("パスワードに数字が含まれていない場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "PasswordPass!");

			const result = await signUp(undefined, formData);

			expect(result?.error).toContain("数字");
			expect(mockSignUp).not.toHaveBeenCalled();
		});

		it("パスワードに記号が含まれていない場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "Password1234");

			const result = await signUp(undefined, formData);

			expect(result?.error).toContain("記号");
			expect(mockSignUp).not.toHaveBeenCalled();
		});
	});

	describe("異常系 - Supabase Authエラー", () => {
		it("Supabase Authエラー時、エラーメッセージが返る", async () => {
			mockSignUp.mockResolvedValue({
				data: { user: null, session: null },
				error: { message: "User already registered" },
			});

			const formData = new FormData();
			formData.append("email", "existing@example.com");
			formData.append("password", "ValidPass123!");

			const result = await signUp(undefined, formData);

			expect(result).toEqual({
				error: "User already registered",
			});
			expect(mockRedirect).not.toHaveBeenCalled();
		});

		it("メールアドレスが既に登録済みの場合、エラーメッセージが返る", async () => {
			mockSignUp.mockResolvedValue({
				data: { user: null, session: null },
				error: { message: "Email already exists" },
			});

			const formData = new FormData();
			formData.append("email", "duplicate@example.com");
			formData.append("password", "SecurePass1!");

			const result = await signUp(undefined, formData);

			expect(result).toEqual({
				error: "Email already exists",
			});
		});
	});

	describe("エッジケース", () => {
		it("セッションが発行された場合、console.errorで警告が出力される", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			mockSignUp.mockResolvedValue({
				data: {
					user: { id: "new-user-id" },
					session: { access_token: "token" }, // セッションが発行される想定外のケース
				},
				error: null,
			});

			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "ValidPass123!");

			try {
				await signUp(undefined, formData);
			} catch (_error) {
				// redirectでthrow
			}

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("セッションが発行されています"),
			);

			consoleErrorSpy.mockRestore();
		});
	});
});
