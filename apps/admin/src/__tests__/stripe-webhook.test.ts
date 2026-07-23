import { beforeEach, describe, expect, it, vi } from "vitest";

// bar_subscriptions への insert / update / select を検証するため、テーブルごとに
// チェーンのスパイを保持しておく。
const upsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
const updateEqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
const updateSpy = vi.fn(() => ({ eq: updateEqSpy }));
const maybeSingleSpy = vi.fn();

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe", () => ({
	stripe: {
		webhooks: {
			constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
		},
	},
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function createMockRequest(): Parameters<typeof POST>[0] {
	return {
		text: async () => "raw-body",
		headers: {
			get: (key: string) => (key === "stripe-signature" ? "sig_test" : null),
		},
	} as unknown as Parameters<typeof POST>[0];
}

// bar_subscriptions テーブルへのアクセスを、select→maybeSingle / insert / update に
// 振り分けるモックチェーンを組む。
function setupBarSubscriptionsMock(existingSub: unknown) {
	maybeSingleSpy.mockResolvedValue({ data: existingSub });
	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bar_subscriptions") {
			return {
				select: vi.fn(() => ({
					eq: vi.fn(() => ({ maybeSingle: maybeSingleSpy })),
				})),
				upsert: upsertSpy,
				update: updateSpy,
			};
		}
		throw new Error(`Unexpected table: ${table}`);
	});
}

function subscriptionCreatedEvent(metadata: Record<string, string> | null) {
	return {
		type: "customer.subscription.created",
		data: {
			object: {
				id: "sub_test123",
				customer: "cus_test123",
				status: "active",
				current_period_start: 1_700_000_000,
				current_period_end: 1_702_592_000,
				cancel_at_period_end: false,
				canceled_at: null,
				metadata,
			},
		},
	};
}

describe("POST /api/webhooks/stripe（customer.subscription.created）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
		// clearAllMocks で実装が消えるため upsert の既定戻り値（成功）を毎回設定し直す。
		upsertSpy.mockResolvedValue({ data: null, error: null });
		updateEqSpy.mockResolvedValue({ data: null, error: null });
	});

	it("署名が無い場合は400を返す", async () => {
		const request = {
			text: async () => "raw-body",
			headers: { get: () => null },
		} as unknown as Parameters<typeof POST>[0];

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("署名検証に失敗した場合は400を返す", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockConstructEvent.mockImplementation(() => {
			throw new Error("Invalid signature");
		});

		const response = await POST(createMockRequest());
		expect(response.status).toBe(400);
		consoleSpy.mockRestore();
	});

	it("既存行が無く metadata がある場合は stripe_subscription_id を onConflict に upsert する", async () => {
		setupBarSubscriptionsMock(null);
		mockConstructEvent.mockReturnValue(
			subscriptionCreatedEvent({
				bar_id: "100001",
				subscription_plan_id: "42",
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(upsertSpy).toHaveBeenCalledTimes(1);
		expect(upsertSpy).toHaveBeenCalledWith(
			{
				bar_id: 100001,
				subscription_plan_id: 42,
				stripe_customer_id: "cus_test123",
				stripe_subscription_id: "sub_test123",
				status: "active",
				current_period_start: new Date(1_700_000_000 * 1000).toISOString(),
				current_period_end: new Date(1_702_592_000 * 1000).toISOString(),
				cancel_at_period_end: false,
				canceled_at: null,
			},
			{ onConflict: "stripe_subscription_id" },
		);
		expect(updateSpy).not.toHaveBeenCalled();
	});

	it("既存行がある場合は upsert せず update する", async () => {
		setupBarSubscriptionsMock({ bar_id: 100001 });
		mockConstructEvent.mockReturnValue(
			subscriptionCreatedEvent({
				bar_id: "100001",
				subscription_plan_id: "42",
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(upsertSpy).not.toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(updateEqSpy).toHaveBeenCalledWith(
			"stripe_subscription_id",
			"sub_test123",
		);
	});

	it("既存行が無く metadata が欠落している場合は upsert をスキップし警告する", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		setupBarSubscriptionsMock(null);
		mockConstructEvent.mockReturnValue(subscriptionCreatedEvent(null));

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(upsertSpy).not.toHaveBeenCalled();
		expect(updateSpy).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it("bar_id 部分ユニーク違反(23505)時は 200 で受理しエラーログを出す（Stripe 無限リトライ回避）", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		setupBarSubscriptionsMock(null);
		upsertSpy.mockResolvedValue({
			data: null,
			error: { code: "23505", message: "duplicate key value" },
		});
		mockConstructEvent.mockReturnValue(
			subscriptionCreatedEvent({
				bar_id: "100001",
				subscription_plan_id: "42",
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("二重サブスク検知"),
		);
		errorSpy.mockRestore();
	});

	it("23505 以外の upsert エラー時は 500 を返す", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		setupBarSubscriptionsMock(null);
		upsertSpy.mockResolvedValue({
			data: null,
			error: { code: "XX000", message: "internal error" },
		});
		mockConstructEvent.mockReturnValue(
			subscriptionCreatedEvent({
				bar_id: "100001",
				subscription_plan_id: "42",
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(500);
		errorSpy.mockRestore();
	});
});
