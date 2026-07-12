import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
// canAccessBar は DELETE では使わない（admin 限定判定に置き換えたため）が、
// route モジュールが import しているのでモックしておく
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	canAccessBar: vi.fn(),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import type { NextRequest } from "next/server";
import { DELETE } from "@/app/api/bars/[barId]/route";

function createMockRequest(): NextRequest {
	// biome-ignore lint/suspicious/noExplicitAny: DELETE は request body を参照しないため最小モック
	return {} as any;
}

function createParams(barId: string) {
	return { params: Promise.resolve({ barId }) };
}

/**
 * DELETE は bars を is_active=false に更新するのみ（論理削除）。
 * - updateError: 更新の失敗
 */
function setupSupabaseMocks(overrides?: { updateError?: unknown }) {
	const updateEq = vi
		.fn()
		.mockResolvedValue({ error: overrides?.updateError ?? null });
	const update = vi.fn().mockReturnValue({ eq: updateEq });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bars") return { update };
		throw new Error(`unexpected table: ${table}`);
	});

	return { update, updateEq };
}

describe("DELETE /api/bars/[barId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("admin が削除すると 200 を返し、bars を is_active=false に更新する（論理削除）", async () => {
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
		const { update, updateEq } = setupSupabaseMocks();

		const response = await DELETE(createMockRequest(), createParams("42"));
		const json = await response.json();

		expect(response.status).toBe(200);
		expect(json.success).toBe(true);
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ is_active: false }),
		);
		expect(updateEq).toHaveBeenCalledWith("id", "42");
	});

	it("未認証の場合は 401 を返し、更新は行わない", async () => {
		mockGetCurrentUser.mockResolvedValue(null);
		const { update } = setupSupabaseMocks();

		const response = await DELETE(createMockRequest(), createParams("42"));

		expect(response.status).toBe(401);
		expect(update).not.toHaveBeenCalled();
	});

	it("bar_owner が自店舗を削除しようとしても 403 を返し、更新は行わない", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "owner-1",
			role: "bar_owner",
			barId: 42,
		});
		const { update } = setupSupabaseMocks();

		const response = await DELETE(createMockRequest(), createParams("42"));

		expect(response.status).toBe(403);
		expect(update).not.toHaveBeenCalled();
	});

	it("更新に失敗した場合は 500 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
		setupSupabaseMocks({ updateError: { message: "db error" } });

		const response = await DELETE(createMockRequest(), createParams("42"));

		expect(response.status).toBe(500);
	});
});
