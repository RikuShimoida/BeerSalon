import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockCanAccessBar = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	canAccessBar: (...args: unknown[]) => mockCanAccessBar(...args),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import { GET } from "@/app/api/bars/[barId]/subscription/route";

function createMockRequest(): Parameters<typeof GET>[0] {
	return { method: "GET" } as Parameters<typeof GET>[0];
}

function createMockParams(barId: string): Parameters<typeof GET>[1] {
	return { params: Promise.resolve({ barId }) };
}

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		maybeSingle: vi.fn().mockResolvedValue(result),
	};
	mockSupabaseFrom.mockReturnValue(chain);
	return chain;
}

describe("GET /api/bars/[barId]/subscription", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("未認証の場合は401を返す", async () => {
		mockGetCurrentUser.mockResolvedValue(null);

		const response = await GET(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
	});

	it("アクセス権限がない店舗のサブスクは照会できず403を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 2,
		});
		mockCanAccessBar.mockReturnValue(false);

		const response = await GET(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(403);
		expect(body.error).toBe("Forbidden");
		// 認可で弾かれた場合は DB を叩かない
		expect(mockSupabaseFrom).not.toHaveBeenCalled();
	});

	it("正常系: 有効サブスクがある場合はそのサブスクを返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: { id: 10, bar_id: 1, status: "active" },
			error: null,
		});

		const response = await GET(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.subscription).toEqual({ id: 10, bar_id: 1, status: "active" });
	});

	it("有効サブスクが無い場合は subscription: null を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({ data: null, error: null });

		const response = await GET(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.subscription).toBeNull();
	});

	it("PGRST116 以外の DB エラー時は500を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: null,
			error: { code: "XX000", message: "internal error" },
		});

		const response = await GET(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("internal error");
	});

	it("admin権限でも照会できる", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "admin-1",
			role: "admin",
			barId: null,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: { id: 20, bar_id: 5, status: "trialing" },
			error: null,
		});

		const response = await GET(createMockRequest(), createMockParams("5"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.subscription).toEqual({
			id: 20,
			bar_id: 5,
			status: "trialing",
		});
	});
});
