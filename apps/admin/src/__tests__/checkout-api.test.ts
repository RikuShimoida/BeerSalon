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

const mockCheckoutSessionsCreate = vi.fn();
vi.mock("@/lib/stripe", () => ({
	stripe: {
		checkout: {
			sessions: {
				create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
			},
		},
	},
}));

import { POST } from "@/app/api/bars/[barId]/checkout/route";

// success_url の元になるオリジン解決を検証するため、リクエストヘッダーを差し込めるようにする。
// resolveRequestOrigin は x-forwarded-host / x-forwarded-proto / host を Headers.get で読む。
function createMockRequest(
	headers: Record<string, string> = {},
): Parameters<typeof POST>[0] {
	return {
		method: "POST",
		headers: new Headers(headers),
	} as Parameters<typeof POST>[0];
}

function createMockParams(barId: string): Parameters<typeof POST>[1] {
	return {
		params: Promise.resolve({ barId }),
	};
}

// bar_subscriptions（active 判定）と subscription_plans（プラン取得）を
// テーブル名で出し分けてモックする。checkout API はこの順で2回 from() を呼ぶ。
function mockSupabaseTables(options: {
	activeSub?: { data: unknown };
	plan?: { data: unknown; error?: unknown };
}) {
	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bar_subscriptions") {
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				in: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				maybeSingle: vi
					.fn()
					.mockResolvedValue(options.activeSub ?? { data: null }),
			};
		}
		if (table === "subscription_plans") {
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				single: vi
					.fn()
					.mockResolvedValue(options.plan ?? { data: null, error: null }),
			};
		}
		throw new Error(`Unexpected table: ${table}`);
	});
}

describe("POST /api/bars/[barId]/checkout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_BASE_URL = "http://localhost:3001";
		process.env.NEXT_PUBLIC_APP_URL = "";
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

	it("既にactiveサブスクがある場合は409を返す（二重課金防止）", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({ activeSub: { data: { id: 10 } } });

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(409);
		expect(body.error).toBe("この店舗は既に課金が開始されています");
		expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
	});

	it("有効な課金プランが存在しない場合は404を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: { data: null, error: { code: "PGRST116" } },
		});

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error).toBe("課金プランが設定されていません");
	});

	it("正常系: Checkout URLが返却され、metadataにbar_id/subscription_plan_idが付与される", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		mockCheckoutSessionsCreate.mockResolvedValue({
			url: "https://checkout.stripe.com/c/pay/test_session",
		});

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.url).toBe("https://checkout.stripe.com/c/pay/test_session");
		expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith({
			mode: "subscription",
			line_items: [{ price: "price_test_5000", quantity: 1 }],
			subscription_data: {
				metadata: {
					bar_id: "1",
					subscription_plan_id: "42",
				},
			},
			success_url: "http://localhost:3001/bars/1",
			cancel_url: "http://localhost:3001/bars/1",
		});
	});

	it("x-forwarded-host/proto がある場合、そのオリジンで success_url を生成する（決済元へ戻る）", async () => {
		// プレビュー環境の ADMIN_BASE_URL は本番ドメインを指すが、リクエストオリジンを優先する。
		process.env.ADMIN_BASE_URL = "https://beer-salon-admin.vercel.app";
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		mockCheckoutSessionsCreate.mockResolvedValue({
			url: "https://checkout.stripe.com/c/pay/preview_session",
		});

		const response = await POST(
			createMockRequest({
				"x-forwarded-host": "beer-salon-admin-develop.vercel.app",
				"x-forwarded-proto": "https",
			}),
			createMockParams("1"),
		);

		expect(response.status).toBe(200);
		expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				success_url: "https://beer-salon-admin-develop.vercel.app/bars/1",
				cancel_url: "https://beer-salon-admin-develop.vercel.app/bars/1",
			}),
		);
	});

	it("host のみ（x-forwarded-proto 無し）の場合は https で success_url を生成する", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		mockCheckoutSessionsCreate.mockResolvedValue({
			url: "https://checkout.stripe.com/c/pay/host_session",
		});

		const response = await POST(
			createMockRequest({ host: "beer-salon-admin-develop.vercel.app" }),
			createMockParams("1"),
		);

		expect(response.status).toBe(200);
		expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				success_url: "https://beer-salon-admin-develop.vercel.app/bars/1",
			}),
		);
	});

	it("ヘッダーが無い場合は ADMIN_BASE_URL にフォールバックする", async () => {
		process.env.ADMIN_BASE_URL = "http://localhost:3001";
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		mockCheckoutSessionsCreate.mockResolvedValue({
			url: "https://checkout.stripe.com/c/pay/fallback_session",
		});

		const response = await POST(createMockRequest(), createMockParams("1"));

		expect(response.status).toBe(200);
		expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				success_url: "http://localhost:3001/bars/1",
			}),
		);
	});

	it("Stripe APIエラー時は500を返し、エラーをログ出力する", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		const stripeError = new Error("Stripe API Error");
		mockCheckoutSessionsCreate.mockRejectedValue(stripeError);

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("Stripe Checkoutの作成に失敗しました");
		expect(consoleSpy).toHaveBeenCalledWith(
			"Stripe Checkout Session作成エラー:",
			stripeError,
		);
		consoleSpy.mockRestore();
	});

	it("baseUrl(ADMIN_BASE_URL/NEXT_PUBLIC_APP_URL)未設定の場合は500を返す", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		process.env.ADMIN_BASE_URL = "";
		process.env.NEXT_PUBLIC_APP_URL = "";
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("Stripe Checkoutの作成に失敗しました");
		expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("Checkoutセッションにurlが無い場合は500を返す", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		mockCheckoutSessionsCreate.mockResolvedValue({ url: null });

		const response = await POST(createMockRequest(), createMockParams("1"));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("Stripe Checkoutの作成に失敗しました");
	});

	it("admin権限でもCheckoutを開始できる", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "admin-1",
			role: "admin",
			barId: null,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockSupabaseTables({
			activeSub: { data: null },
			plan: {
				data: { id: 42, stripe_price_id: "price_test_5000" },
				error: null,
			},
		});
		mockCheckoutSessionsCreate.mockResolvedValue({
			url: "https://checkout.stripe.com/c/pay/admin_session",
		});

		const response = await POST(createMockRequest(), createMockParams("5"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.url).toBe("https://checkout.stripe.com/c/pay/admin_session");
	});
});
