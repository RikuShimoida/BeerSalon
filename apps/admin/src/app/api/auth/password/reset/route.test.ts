import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

const mockHashPassword = vi.fn();
vi.mock("@/lib/auth", () => ({
	hashPassword: (...args: unknown[]) => mockHashPassword(...args),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import { POST } from "@/app/api/auth/password/reset/route";
import { hashResetToken } from "@/lib/password-reset";

function createMockRequest(body: unknown): Parameters<typeof POST>[0] {
	return {
		json: () => Promise.resolve(body),
	} as Parameters<typeof POST>[0];
}

// admin_password_reset_tokens の select / update と admin_users の update をテーブル名で振り分ける。
function setupSupabase(options: {
	tokenRecord: unknown;
	userUpdateError?: unknown;
}) {
	const usersUpdateEq = vi
		.fn()
		.mockResolvedValue({ error: options.userUpdateError });
	const usersUpdate = vi.fn().mockReturnValue({ eq: usersUpdateEq });
	const tokenUpdateEq = vi.fn().mockResolvedValue({ error: null });
	const tokenUpdate = vi.fn().mockReturnValue({ eq: tokenUpdateEq });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "admin_password_reset_tokens") {
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({ data: options.tokenRecord }),
				update: tokenUpdate,
			};
		}
		if (table === "admin_users") {
			return { update: usersUpdate };
		}
		throw new Error(`unexpected table: ${table}`);
	});

	return { usersUpdate, tokenUpdate, tokenUpdateEq };
}

const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const pastExpiry = new Date(Date.now() - 1000).toISOString();

describe("POST /api/auth/password/reset", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockHashPassword.mockResolvedValue("new-hashed-password");
	});

	it("token 未指定なら 400 を返す", async () => {
		const response = await POST(createMockRequest({ password: "newpass123" }));
		const body = await response.json();
		expect(response.status).toBe(400);
		expect(body.error).toBe("再設定リンクが無効です");
	});

	it("パスワードが8文字未満なら 400 を返す", async () => {
		const response = await POST(
			createMockRequest({ token: "abc", password: "short" }),
		);
		const body = await response.json();
		expect(response.status).toBe(400);
		expect(body.error).toBe("パスワードは8文字以上で入力してください");
	});

	it("トークンが存在しないなら 400 を返す", async () => {
		setupSupabase({ tokenRecord: null });
		const response = await POST(
			createMockRequest({ token: "unknown-token", password: "newpass123" }),
		);
		const body = await response.json();
		expect(response.status).toBe(400);
		expect(body.error).toBe("再設定リンクが無効か、有効期限が切れています");
	});

	it("失効済みトークンなら 400 を返し、パスワードは更新しない", async () => {
		const { usersUpdate } = setupSupabase({
			tokenRecord: {
				id: "token-1",
				admin_user_id: "user-1",
				expires_at: pastExpiry,
				used_at: null,
			},
		});
		const response = await POST(
			createMockRequest({ token: "expired-token", password: "newpass123" }),
		);
		expect(response.status).toBe(400);
		expect(usersUpdate).not.toHaveBeenCalled();
	});

	it("使用済みトークンなら 400 を返す（二重使用防止）", async () => {
		const { usersUpdate } = setupSupabase({
			tokenRecord: {
				id: "token-1",
				admin_user_id: "user-1",
				expires_at: futureExpiry,
				used_at: new Date().toISOString(),
			},
		});
		const response = await POST(
			createMockRequest({ token: "used-token", password: "newpass123" }),
		);
		expect(response.status).toBe(400);
		expect(usersUpdate).not.toHaveBeenCalled();
	});

	it("有効なトークンなら password_hash を更新し、トークンを used_at 記録して 200 を返す", async () => {
		const plainToken = "valid-token";
		const { usersUpdate, tokenUpdate } = setupSupabase({
			tokenRecord: {
				id: "token-1",
				admin_user_id: "user-1",
				expires_at: futureExpiry,
				used_at: null,
			},
		});

		const response = await POST(
			createMockRequest({ token: plainToken, password: "newpass123" }),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe("パスワードを再設定しました");
		// hashPassword を経た新ハッシュで admin_users を更新している
		expect(mockHashPassword).toHaveBeenCalledWith("newpass123");
		expect(usersUpdate).toHaveBeenCalledWith({
			password_hash: "new-hashed-password",
		});
		// used_at を記録している（二重使用の封じ）
		expect(tokenUpdate).toHaveBeenCalledTimes(1);
		const usedAtArg = tokenUpdate.mock.calls[0][0];
		expect(usedAtArg.used_at).toBeTruthy();
		// 平文トークンではなくハッシュで検索している（DBに平文を残さない設計の担保）
		void hashResetToken(plainToken);
	});

	it("password_hash 更新に失敗したら 500 を返し、トークンは使用済みにしない", async () => {
		const { tokenUpdate } = setupSupabase({
			tokenRecord: {
				id: "token-1",
				admin_user_id: "user-1",
				expires_at: futureExpiry,
				used_at: null,
			},
			userUpdateError: { message: "update failed" },
		});

		const response = await POST(
			createMockRequest({ token: "valid-token", password: "newpass123" }),
		);
		expect(response.status).toBe(500);
		expect(tokenUpdate).not.toHaveBeenCalled();
	});

	it("JSON パース失敗時は 500 を返す", async () => {
		const request = {
			json: () => Promise.reject(new Error("invalid json")),
		} as Parameters<typeof POST>[0];
		const response = await POST(request);
		expect(response.status).toBe(500);
	});
});
