import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/bars/[barId]/approve/route";

function createMockRequest(): NextRequest {
	// biome-ignore lint/suspicious/noExplicitAny: approve は request body を参照しないため最小モック
	return {} as any;
}

function createParams(barId: string) {
	return { params: Promise.resolve({ barId }) };
}

/**
 * approve は admin_users を検索 → approval_status を approved に更新 → bars を is_active=true に更新。
 * - adminUser: 検索結果（null なら 404）
 * - updateAdminError / updateBarError: 各更新の失敗
 */
function setupSupabaseMocks(overrides?: {
	adminUser?: unknown;
	updateAdminError?: unknown;
	updateBarError?: unknown;
}) {
	const adminUser =
		overrides?.adminUser === undefined
			? { id: "admin-user-1", approval_status: "pending" }
			: overrides.adminUser;

	const adminMaybeSingle = vi
		.fn()
		.mockResolvedValue({ data: adminUser, error: null });
	const adminSelectEq2 = vi
		.fn()
		.mockReturnValue({ maybeSingle: adminMaybeSingle });
	const adminSelectEq1 = vi.fn().mockReturnValue({ eq: adminSelectEq2 });
	const adminSelect = vi.fn().mockReturnValue({ eq: adminSelectEq1 });

	const adminUpdateEq = vi
		.fn()
		.mockResolvedValue({ error: overrides?.updateAdminError ?? null });
	const adminUpdate = vi.fn().mockReturnValue({ eq: adminUpdateEq });

	const barUpdateEq = vi
		.fn()
		.mockResolvedValue({ error: overrides?.updateBarError ?? null });
	const barUpdate = vi.fn().mockReturnValue({ eq: barUpdateEq });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "admin_users")
			return { select: adminSelect, update: adminUpdate };
		if (table === "bars") return { update: barUpdate };
		throw new Error(`unexpected table: ${table}`);
	});

	return { adminUpdate, barUpdate };
}

describe("POST /api/bars/[barId]/approve", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("admin が承認すると 200 を返し、admin_users を approved・bars を is_active=true に更新する", async () => {
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
		const { adminUpdate, barUpdate } = setupSupabaseMocks();

		const response = await POST(createMockRequest(), createParams("42"));
		const json = await response.json();

		expect(response.status).toBe(200);
		expect(json.approvalStatus).toBe("approved");
		expect(adminUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ approval_status: "approved" }),
		);
		expect(barUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ is_active: true }),
		);
	});

	it("未認証の場合は 401 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue(null);
		setupSupabaseMocks();

		const response = await POST(createMockRequest(), createParams("42"));
		expect(response.status).toBe(401);
	});

	it("bar_owner の場合は 403 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "owner-1",
			role: "bar_owner",
			barId: 42,
		});
		setupSupabaseMocks();

		const response = await POST(createMockRequest(), createParams("42"));
		expect(response.status).toBe(403);
	});

	it("barId が不正な場合は 400 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
		setupSupabaseMocks();

		const response = await POST(createMockRequest(), createParams("abc"));
		expect(response.status).toBe(400);
	});

	it("承認対象の店舗アカウントが存在しない場合は 404 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
		setupSupabaseMocks({ adminUser: null });

		const response = await POST(createMockRequest(), createParams("42"));
		expect(response.status).toBe(404);
	});
});
