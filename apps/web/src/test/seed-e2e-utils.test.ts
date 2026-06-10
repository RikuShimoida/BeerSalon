import { describe, expect, it, vi } from "vitest";
import { findExistingUserId } from "../../../../prisma/seed-e2e-utils";

describe("findExistingUserId（E2E seed ユーザー検索）", () => {
	it("存在するメールアドレスのユーザーIDを返す", async () => {
		const mockSupabase = {
			auth: {
				admin: {
					listUsers: vi.fn().mockResolvedValue({
						data: {
							users: [
								{ id: "uuid-a", email: "other@example.test" },
								{ id: "uuid-b", email: "smoke-user@example.test" },
							],
						},
						error: null,
					}),
				},
			},
		};

		const result = await findExistingUserId(
			mockSupabase,
			"smoke-user@example.test",
		);

		expect(result).toBe("uuid-b");
	});

	it("存在しないメールアドレスの場合はnullを返す", async () => {
		const mockSupabase = {
			auth: {
				admin: {
					listUsers: vi.fn().mockResolvedValue({
						data: {
							users: [{ id: "uuid-a", email: "other@example.test" }],
						},
						error: null,
					}),
				},
			},
		};

		const result = await findExistingUserId(
			mockSupabase,
			"smoke-user@example.test",
		);

		expect(result).toBeNull();
	});

	it("listUsersがエラーを返した場合は例外を投げる", async () => {
		const mockSupabase = {
			auth: {
				admin: {
					listUsers: vi.fn().mockResolvedValue({
						data: { users: [] },
						error: { message: "auth API error" },
					}),
				},
			},
		};

		await expect(
			findExistingUserId(mockSupabase, "smoke-user@example.test"),
		).rejects.toThrow(/Failed to list users/);
	});
});
