import { beforeEach, describe, expect, it, vi } from "vitest";

// next/navigationのモック
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// Supabase clientのモック
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			signInWithPassword: mockSignInWithPassword,
		},
	})),
}));

import { login } from "./actions";

describe("login", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("有効な認証情報でログインが成功し、エラーが返らない", async () => {
			// Supabase Auth成功をモック
			mockSignInWithPassword.mockResolvedValue({
				data: { user: { id: "test-user-id" }, session: {} },
				error: null,
			});

			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "ValidPassword123!");

			const result = await login(undefined, formData);

			expect(mockSignInWithPassword).toHaveBeenCalledWith({
				email: "test@example.com",
				password: "ValidPassword123!",
			});
			expect(result).toBeUndefined();
		});

		it("成功時にredirect('/')が呼ばれる", async () => {
			mockSignInWithPassword.mockResolvedValue({
				data: { user: { id: "test-user-id" }, session: {} },
				error: null,
			});

			const formData = new FormData();
			formData.append("email", "valid@example.com");
			formData.append("password", "SecurePass1!");

			try {
				await login(undefined, formData);
			} catch (_error) {
				// redirectは実際にはthrowするので、catchでモック呼び出しを確認
			}

			expect(mockRedirect).toHaveBeenCalledWith("/");
		});
	});

	describe("異常系 - バリデーションエラー", () => {
		it("メールアドレスが空の場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "");
			formData.append("password", "Password123!");

			const result = await login(undefined, formData);

			expect(result).toEqual({
				error: "メールアドレスを入力してください",
			});
			expect(mockSignInWithPassword).not.toHaveBeenCalled();
		});

		it("パスワードが空の場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "");

			const result = await login(undefined, formData);

			expect(result).toEqual({
				error: "パスワードを入力してください",
			});
			expect(mockSignInWithPassword).not.toHaveBeenCalled();
		});

		it("メール形式が不正な場合、バリデーションエラーが返る", async () => {
			const formData = new FormData();
			formData.append("email", "invalid-email");
			formData.append("password", "Password123!");

			const result = await login(undefined, formData);

			expect(result).toEqual({
				error: "有効なメールアドレスを入力してください",
			});
			expect(mockSignInWithPassword).not.toHaveBeenCalled();
		});
	});

	describe("異常系 - 認証失敗", () => {
		it("Supabase Auth認証失敗時、エラーメッセージが返る", async () => {
			mockSignInWithPassword.mockResolvedValue({
				data: { user: null, session: null },
				error: { message: "Invalid login credentials" },
			});

			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "WrongPassword!");

			const result = await login(undefined, formData);

			expect(result).toEqual({
				error: "メールアドレスまたはパスワードが違います",
			});
			expect(mockRedirect).not.toHaveBeenCalled();
		});
	});

	describe("エッジケース", () => {
		it("FormDataにnullが含まれる場合、文字列として扱われる", async () => {
			const formData = new FormData();
			formData.append("email", "test@example.com");
			formData.append("password", "null");

			const _result = await login(undefined, formData);

			// "null"という文字列はバリデーションを通過しないので、パスワード強度エラーになる可能性
			// しかし、loginSchemaはパスワードの文字列チェックのみなので、通過する
			// 実際の認証で失敗することを期待
			expect(mockSignInWithPassword).toHaveBeenCalled();
		});
	});
});
