import { beforeEach, describe, expect, it, vi } from "vitest";

// Why not: auth.ts は import 時に JWT_SECRET の存在チェックを行うため、
//          session route から逆参照される時点で環境変数が必要。
process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

import { GET } from "@/app/api/auth/session/route";

describe("GET /api/auth/session", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("有効な認証情報の場合 200 と user 情報を返す", async () => {
		const fakeUser = {
			id: "user-1",
			barManageId: "test-bar",
			name: "テストオーナー",
			role: "bar_owner" as const,
			barId: 1,
		};
		mockGetCurrentUser.mockResolvedValue(fakeUser);

		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.user).toEqual(fakeUser);
	});

	it("未認証（getCurrentUser が null）の場合 401 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue(null);

		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("認証されていません");
	});

	it("getCurrentUser が例外を投げた場合 500 を返す", async () => {
		mockGetCurrentUser.mockRejectedValue(new Error("session error"));

		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("セッション情報の取得に失敗しました");
	});
});
