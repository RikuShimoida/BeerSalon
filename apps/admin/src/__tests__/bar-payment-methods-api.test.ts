import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockCanAccessBar = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	canAccessBar: (...args: unknown[]) => mockCanAccessBar(...args),
}));

const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
		rpc: (...args: unknown[]) => mockSupabaseRpc(...args),
	},
}));

// URL バリデータは本テストの対象外なので常に valid を返すモックにし、
// 子データ同期ロジックの検証に集中する
vi.mock("@/lib/validators", () => ({
	validateWebsiteUrl: () => ({ isValid: true }),
	validateInstagramUrl: () => ({ isValid: true }),
	validateXUrl: () => ({ isValid: true }),
	validateFacebookUrl: () => ({ isValid: true }),
	validateLineUrl: () => ({ isValid: true }),
	validateCoordinates: () => ({
		isValid: true,
		latitude: null,
		longitude: null,
	}),
}));

import type { NextRequest } from "next/server";
import { PUT } from "@/app/api/bars/[barId]/route";

function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
		// biome-ignore lint/suspicious/noExplicitAny: PUT が参照する json のみを持つ最小モック
	} as any;
}

/**
 * bars PUT は bars テーブルを update した後、子データ（支払い方法・営業時間）を
 * sync RPC で原子的に同期する。RPC はテーブル名ではなく関数名で観測する。
 */
function setupSupabaseMocks(overrides?: { rpcError?: unknown }) {
	const barSingle = vi
		.fn()
		.mockResolvedValue({ data: { id: 1, name: "テストバー" }, error: null });
	const barSelect = vi.fn().mockReturnValue({ single: barSingle });
	const barEq = vi.fn().mockReturnValue({ select: barSelect });
	const barUpdate = vi.fn().mockReturnValue({ eq: barEq });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bars") return { update: barUpdate };
		throw new Error(`unexpected table: ${table}`);
	});

	mockSupabaseRpc.mockResolvedValue({ error: overrides?.rpcError ?? null });
}

describe("PUT /api/bars/[barId] 支払い方法同期", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("選択した支払い方法を sync RPC に委譲する（DELETE→INSERT を原子化）", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [1, 3],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		// DELETE 単独クエリ（.from("bar_payment_methods")）は発行せず、RPC に一本化する
		expect(mockSupabaseFrom).not.toHaveBeenCalledWith("bar_payment_methods");
		expect(mockSupabaseRpc).toHaveBeenCalledWith("sync_bar_payment_methods", {
			p_bar_id: 5,
			p_payment_method_ids: [1, 3],
		});
	});

	it("重複した payment_method_id を除去して RPC に渡す", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [1, 1, 3],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(mockSupabaseRpc).toHaveBeenCalledWith("sync_bar_payment_methods", {
			p_bar_id: 5,
			p_payment_method_ids: [1, 3],
		});
	});

	it("空配列を渡すと RPC には空配列を渡す（全削除のみ）", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(mockSupabaseRpc).toHaveBeenCalledWith("sync_bar_payment_methods", {
			p_bar_id: 5,
			p_payment_method_ids: [],
		});
	});

	it("payment_method_ids を送らない場合は RPC を呼ばない", async () => {
		setupSupabaseMocks();

		const response = await PUT(createMockRequest({ name: "テストバー" }), {
			params: Promise.resolve({ barId: "5" }),
		});

		expect(response.status).toBe(200);
		expect(mockSupabaseRpc).not.toHaveBeenCalledWith(
			"sync_bar_payment_methods",
			expect.anything(),
		);
	});

	it("整数でない値を含む場合は 400 を返し RPC を呼ばない（既存データに触れない）", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [1, "abc"],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(400);
		expect(mockSupabaseRpc).not.toHaveBeenCalledWith(
			"sync_bar_payment_methods",
			expect.anything(),
		);
	});

	it("配列でない値を渡すと 400 を返し RPC を呼ばない", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: "1,2,3",
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(400);
		expect(mockSupabaseRpc).not.toHaveBeenCalledWith(
			"sync_bar_payment_methods",
			expect.anything(),
		);
	});

	it("sync RPC が失敗した場合は 500 を返す", async () => {
		setupSupabaseMocks({ rpcError: { message: "sync failed" } });

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [2],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(500);
	});
});

describe("PUT /api/bars/[barId] 営業時間同期", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("整形済み営業時間を sync RPC に委譲する（HH:MM:SS 付与・定休日反映）", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				opening_hours: [
					{
						day_of_week: 0,
						open_time: "17:00",
						close_time: "23:00",
						sort_order: 0,
						is_closed: false,
					},
					{
						day_of_week: 1,
						open_time: "",
						close_time: "",
						sort_order: 0,
						is_closed: true,
					},
				],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(mockSupabaseFrom).not.toHaveBeenCalledWith("bar_opening_hours");
		expect(mockSupabaseRpc).toHaveBeenCalledWith("sync_bar_opening_hours", {
			p_bar_id: 5,
			p_opening_hours: [
				{
					day_of_week: 0,
					open_time: "17:00:00",
					close_time: "23:00:00",
					sort_order: 0,
					is_closed: false,
				},
				{
					day_of_week: 1,
					open_time: "00:00:00",
					close_time: "00:00:00",
					sort_order: 0,
					is_closed: true,
				},
			],
		});
	});

	it("時刻未入力かつ非定休日の行は除外して RPC に渡す", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				opening_hours: [
					{
						day_of_week: 0,
						open_time: "",
						close_time: "",
						sort_order: 0,
						is_closed: false,
					},
				],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(mockSupabaseRpc).toHaveBeenCalledWith("sync_bar_opening_hours", {
			p_bar_id: 5,
			p_opening_hours: [],
		});
	});

	it("opening_hours を送らない場合は RPC を呼ばない", async () => {
		setupSupabaseMocks();

		const response = await PUT(createMockRequest({ name: "テストバー" }), {
			params: Promise.resolve({ barId: "5" }),
		});

		expect(response.status).toBe(200);
		expect(mockSupabaseRpc).not.toHaveBeenCalledWith(
			"sync_bar_opening_hours",
			expect.anything(),
		);
	});

	it("配列でない値を渡すと 400 を返し RPC を呼ばない", async () => {
		setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				opening_hours: "invalid",
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(400);
		expect(mockSupabaseRpc).not.toHaveBeenCalledWith(
			"sync_bar_opening_hours",
			expect.anything(),
		);
	});

	it("sync RPC が失敗した場合は 500 を返す", async () => {
		setupSupabaseMocks({ rpcError: { message: "sync failed" } });

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				opening_hours: [
					{
						day_of_week: 0,
						open_time: "17:00",
						close_time: "23:00",
						sort_order: 0,
						is_closed: false,
					},
				],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(500);
	});
});
