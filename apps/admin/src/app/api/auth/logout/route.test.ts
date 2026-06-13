import { beforeEach, describe, expect, it, vi } from "vitest";

// Why not: auth.ts は import 時に JWT_SECRET の存在チェックを行うため、
//          logout route から逆参照される時点で環境変数が必要。
process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

const mockRemoveAuthCookie = vi.fn();
vi.mock("@/lib/auth", () => ({
	removeAuthCookie: (...args: unknown[]) => mockRemoveAuthCookie(...args),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("removeAuthCookie が呼び出され 200 と success を返す", async () => {
		mockRemoveAuthCookie.mockResolvedValue(undefined);

		const response = await POST();
		const body = await response.json();

		expect(mockRemoveAuthCookie).toHaveBeenCalledTimes(1);
		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
	});

	it("removeAuthCookie が例外を投げた場合 500 を返す", async () => {
		mockRemoveAuthCookie.mockRejectedValue(new Error("cookie error"));

		const response = await POST();
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("ログアウトに失敗しました");
	});
});
