import { beforeEach, describe, expect, it, vi } from "vitest";

// Why not: auth.ts は import 時に JWT_SECRET の存在チェックを行うため、
//          login route から逆参照される時点で環境変数が必要。
process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

const mockVerifyPassword = vi.fn();
const mockCreateToken = vi.fn();
const mockSetAuthCookie = vi.fn();
vi.mock("@/lib/auth", () => ({
	verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
	createToken: (...args: unknown[]) => mockCreateToken(...args),
	setAuthCookie: (...args: unknown[]) => mockSetAuthCookie(...args),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import { POST } from "@/app/api/auth/login/route";

function createMockRequest(body: unknown): Parameters<typeof POST>[0] {
	return {
		json: () => Promise.resolve(body),
	} as Parameters<typeof POST>[0];
}

function mockSupabaseSingle(result: { data: unknown; error: unknown }) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue(result),
	};
	mockSupabaseFrom.mockReturnValue(chain);
	return chain;
}

describe("POST /api/auth/login", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("barManageId が未指定の場合 400 を返す", async () => {
		const response = await POST(createMockRequest({ password: "Test1234!@#" }));
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("入力してください");
	});

	it("password が未指定の場合 400 を返す", async () => {
		const response = await POST(createMockRequest({ barManageId: "test-bar" }));
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("入力してください");
	});

	it("存在しない bar_manage_id（is_active=false 含む）の場合 401 を返す", async () => {
		// is_active=true の絞り込みに該当しない or 該当ユーザーなしのケース
		mockSupabaseSingle({ data: null, error: { message: "not found" } });

		const response = await POST(
			createMockRequest({
				barManageId: "non-existent",
				password: "Test1234!@#",
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("店舗IDまたはパスワードが正しくありません");
	});

	it("間違ったパスワードの場合 401 を返す", async () => {
		mockSupabaseSingle({
			data: {
				id: "user-1",
				bar_manage_id: "test-bar",
				password_hash: "hashed-password",
				name: "テストオーナー",
				role: "bar_owner",
				bar_id: 1,
			},
			error: null,
		});
		mockVerifyPassword.mockResolvedValue(false);

		const response = await POST(
			createMockRequest({
				barManageId: "test-bar",
				password: "WrongPassword!",
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("店舗IDまたはパスワードが正しくありません");
	});

	it("正しい認証情報の場合 200 と user 情報を返し、setAuthCookie が呼ばれる", async () => {
		mockSupabaseSingle({
			data: {
				id: "user-1",
				bar_manage_id: "test-bar",
				password_hash: "hashed-password",
				name: "テストオーナー",
				role: "bar_owner",
				bar_id: 1,
			},
			error: null,
		});
		mockVerifyPassword.mockResolvedValue(true);
		mockCreateToken.mockResolvedValue("dummy-jwt-token");

		const response = await POST(
			createMockRequest({ barManageId: "test-bar", password: "Test1234!@#" }),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.user).toEqual({
			id: "user-1",
			barManageId: "test-bar",
			name: "テストオーナー",
			role: "bar_owner",
			barId: 1,
		});
		expect(mockSetAuthCookie).toHaveBeenCalledWith("dummy-jwt-token");
	});

	it("JSON パース失敗など想定外エラー時は 500 を返す", async () => {
		const request = {
			json: () => Promise.reject(new Error("invalid json")),
		} as Parameters<typeof POST>[0];

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("ログインに失敗しました");
	});
});
