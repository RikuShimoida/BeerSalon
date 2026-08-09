import { beforeEach, describe, expect, it, vi } from "vitest";

// bar_subscriptions / invoices への insert / update / select を検証するため、
// テーブルごとにチェーンのスパイを保持しておく。
const upsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
const updateEqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
const updateSpy = vi.fn(() => ({ eq: updateEqSpy }));
const maybeSingleSpy = vi.fn();
const singleSpy = vi.fn();
const invoiceInsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });

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

// bar_subscriptions テーブルへのアクセスを、select→maybeSingle / upsert / update に
// 振り分けるモックチェーンを組む。invoices テーブルへの insert / select→single も扱う。
function setupBarSubscriptionsMock(
	existingSub: unknown,
	invoiceBarSub: unknown = { bar_id: 1, id: 10 },
) {
	maybeSingleSpy.mockResolvedValue({ data: existingSub });
	singleSpy.mockResolvedValue({ data: invoiceBarSub });
	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bar_subscriptions") {
			return {
				select: vi.fn(() => ({
					eq: vi.fn(() => ({
						maybeSingle: maybeSingleSpy,
						single: singleSpy,
					})),
				})),
				upsert: upsertSpy,
				update: updateSpy,
			};
		}
		if (table === "invoices") {
			return {
				insert: invoiceInsertSpy,
			};
		}
		throw new Error(`Unexpected table: ${table}`);
	});
}

// 新API形状（2026-05-27.dahlia）: current_period_* は items.data[0] 配下に存在し、
// トップレベルには存在しない。
function subscriptionCreatedEvent(metadata: Record<string, string> | null) {
	return {
		type: "customer.subscription.created",
		data: {
			object: {
				id: "sub_test123",
				customer: "cus_test123",
				status: "active",
				cancel_at_period_end: false,
				canceled_at: null,
				metadata,
				items: {
					data: [
						{
							current_period_start: 1_700_000_000,
							current_period_end: 1_702_592_000,
						},
					],
				},
			},
		},
	};
}

// 旧API形状: current_period_* がトップレベルに存在し、items 配下は無い。
function legacySubscriptionCreatedEvent(
	metadata: Record<string, string> | null,
) {
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

// current_period_* がトップレベルにも items 配下にも存在しない不正形状。
function noPeriodSubscriptionCreatedEvent(
	metadata: Record<string, string> | null,
) {
	return {
		type: "customer.subscription.created",
		data: {
			object: {
				id: "sub_test123",
				customer: "cus_test123",
				status: "active",
				cancel_at_period_end: false,
				canceled_at: null,
				metadata,
				items: { data: [{}] },
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
		invoiceInsertSpy.mockResolvedValue({ data: null, error: null });
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

	it("新API形状（current_period_* が items.data[0] 配下）で期間付き upsert が成立する", async () => {
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

	it("旧API形状（current_period_* がトップレベル）でも互換フォールバックで upsert が成立する", async () => {
		setupBarSubscriptionsMock(null);
		mockConstructEvent.mockReturnValue(
			legacySubscriptionCreatedEvent({
				bar_id: "100001",
				subscription_plan_id: "42",
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(upsertSpy).toHaveBeenCalledTimes(1);
		expect(upsertSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				current_period_start: new Date(1_700_000_000 * 1000).toISOString(),
				current_period_end: new Date(1_702_592_000 * 1000).toISOString(),
			}),
			{ onConflict: "stripe_subscription_id" },
		);
	});

	it("current_period_* が両形状とも取得できない場合は upsert をスキップし 200 で受理する", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		setupBarSubscriptionsMock(null);
		mockConstructEvent.mockReturnValue(
			noPeriodSubscriptionCreatedEvent({
				bar_id: "100001",
				subscription_plan_id: "42",
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(upsertSpy).not.toHaveBeenCalled();
		expect(updateSpy).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("current_period_* を取得できません"),
		);
		warnSpy.mockRestore();
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

describe("POST /api/webhooks/stripe（invoice イベントの subscription 取得）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
		invoiceInsertSpy.mockResolvedValue({ data: null, error: null });
		updateEqSpy.mockResolvedValue({ data: null, error: null });
	});

	function invoicePaidEvent(object: Record<string, unknown>) {
		return {
			type: "invoice.paid",
			data: { object },
		};
	}

	it("新API形状（parent.subscription_details.subscription）から subscriptionId を取得し invoices に insert する", async () => {
		setupBarSubscriptionsMock(null, { bar_id: 7, id: 55 });
		mockConstructEvent.mockReturnValue(
			invoicePaidEvent({
				id: "in_test123",
				amount_paid: 5000,
				amount_due: 5000,
				currency: "jpy",
				invoice_pdf: "https://example.com/invoice.pdf",
				status_transitions: { paid_at: 1_700_000_000 },
				parent: {
					subscription_details: { subscription: "sub_test123" },
				},
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(invoiceInsertSpy).toHaveBeenCalledTimes(1);
		expect(invoiceInsertSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				bar_id: 7,
				bar_subscription_id: 55,
				stripe_invoice_id: "in_test123",
				status: "paid",
			}),
		);
	});

	it("parent.subscription_details.subscription が展開オブジェクトでも id を取り出す", async () => {
		setupBarSubscriptionsMock(null, { bar_id: 7, id: 55 });
		mockConstructEvent.mockReturnValue(
			invoicePaidEvent({
				id: "in_test123",
				amount_paid: 5000,
				amount_due: 5000,
				currency: "jpy",
				invoice_pdf: null,
				status_transitions: { paid_at: null },
				parent: {
					subscription_details: { subscription: { id: "sub_test123" } },
				},
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(singleSpy).toHaveBeenCalled();
		expect(invoiceInsertSpy).toHaveBeenCalledTimes(1);
	});

	it("旧API形状（トップレベル subscription）でもフォールバックで取得する", async () => {
		setupBarSubscriptionsMock(null, { bar_id: 7, id: 55 });
		mockConstructEvent.mockReturnValue(
			invoicePaidEvent({
				id: "in_test123",
				subscription: "sub_test123",
				amount_paid: 5000,
				amount_due: 5000,
				currency: "jpy",
				invoice_pdf: null,
				status_transitions: { paid_at: null },
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(invoiceInsertSpy).toHaveBeenCalledTimes(1);
	});

	it("subscription をどこからも取得できない場合は invoices に insert しない", async () => {
		setupBarSubscriptionsMock(null, { bar_id: 7, id: 55 });
		mockConstructEvent.mockReturnValue(
			invoicePaidEvent({
				id: "in_test123",
				amount_paid: 5000,
				amount_due: 5000,
				currency: "jpy",
				invoice_pdf: null,
				status_transitions: { paid_at: null },
				parent: { subscription_details: null },
			}),
		);

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(invoiceInsertSpy).not.toHaveBeenCalled();
	});

	it("invoice.payment_failed で parent 配下の subscription から past_due 更新する", async () => {
		setupBarSubscriptionsMock(null);
		mockConstructEvent.mockReturnValue({
			type: "invoice.payment_failed",
			data: {
				object: {
					parent: {
						subscription_details: { subscription: "sub_test123" },
					},
				},
			},
		});

		const response = await POST(createMockRequest());

		expect(response.status).toBe(200);
		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(updateEqSpy).toHaveBeenCalledWith(
			"stripe_subscription_id",
			"sub_test123",
		);
	});
});
