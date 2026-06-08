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

const mockPortalSessionsCreate = vi.fn();
vi.mock("@/lib/stripe", () => ({
	stripe: {
		billingPortal: {
			sessions: {
				create: (...args: unknown[]) => mockPortalSessionsCreate(...args),
			},
		},
	},
}));

import { POST } from "@/app/api/bars/[barId]/portal/route";

function createMockRequest(): Parameters<typeof POST>[0] {
	return {
		method: "POST",
	} as Parameters<typeof POST>[0];
}

function createMockParams(barId: string): Parameters<typeof POST>[1] {
	return {
		params: Promise.resolve({ barId }),
	};
}

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue(result),
	};
	mockSupabaseFrom.mockReturnValue(chain);
	return chain;
}

describe("POST /api/bars/[barId]/portal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
	});

	it("未認証の場合は401を返す", async () => {
		mockGetCurrentUser.mockResolvedValue(null);

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
	});

	it("アクセス権限がない場合は403を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 2,
		});
		mockCanAccessBar.mockReturnValue(false);

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(403);
		expect(body.error).toBe("Forbidden");
	});

	it("サブスクリプションが存在しない場合は404を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: null,
			error: { code: "PGRST116", message: "Not found" },
		});

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error).toBe("サブスクリプションが設定されていません");
	});

	it("正常系: Portal URLが返却される", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: { stripe_customer_id: "cus_test123" },
			error: null,
		});
		mockPortalSessionsCreate.mockResolvedValue({
			url: "https://billing.stripe.com/session/test_session_url",
		});

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.url).toBe(
			"https://billing.stripe.com/session/test_session_url",
		);
		expect(mockPortalSessionsCreate).toHaveBeenCalledWith({
			customer: "cus_test123",
			return_url: "http://localhost:3001/bars/1",
		});
	});

	it("Stripe APIエラー時は500を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: { stripe_customer_id: "cus_test123" },
			error: null,
		});
		mockPortalSessionsCreate.mockRejectedValue(new Error("Stripe API Error"));

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("Stripe Customer Portalの作成に失敗しました");
	});

	it("admin権限でもアクセスできる", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "admin-1",
			role: "admin",
			barId: null,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseChain({
			data: { stripe_customer_id: "cus_test456" },
			error: null,
		});
		mockPortalSessionsCreate.mockResolvedValue({
			url: "https://billing.stripe.com/session/admin_session",
		});

		const response = await POST(createMockRequest(), createMockParams("5"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.url).toBe("https://billing.stripe.com/session/admin_session");
	});
});
