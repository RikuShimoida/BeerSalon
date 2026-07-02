import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	hashPassword: () => Promise.resolve("hashed-password"),
}));

const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
		rpc: (...args: unknown[]) => mockSupabaseRpc(...args),
	},
}));

// URL バリデータは本テストの対象外なので常に valid を返すモックにする。
// 営業時間の要素バリデーション（validateOpeningHours）は検証対象そのものなので実装を使う。
vi.mock("@/lib/validators", async () => {
	const actual =
		await vi.importActual<typeof import("@/lib/validators")>(
			"@/lib/validators",
		);
	return {
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
		validateOpeningHours: actual.validateOpeningHours,
	};
});

vi.mock("@/lib/shizuoka-cities", () => ({
	SHIZUOKA_PREFECTURE: "静岡県",
}));

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/bars/route";

function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
		// biome-ignore lint/suspicious/noExplicitAny: POST が参照する json のみを持つ最小モック
	} as any;
}

/**
 * POST /api/bars は bars を作成し、admin_users を作成した後、
 * 営業時間を sync RPC で登録する。
 * - barInsert: bars テーブルへの insert（作成された bar を返す）
 * - adminUsersInsert: admin_users への insert
 * - bar_manage_id 重複チェック: admin_users.select().eq().maybeSingle()
 */
function setupSupabaseMocks(overrides?: {
	rpcError?: unknown;
	barInsertError?: unknown;
}) {
	const barSingle = vi.fn().mockResolvedValue({
		data: overrides?.barInsertError ? null : { id: 42, name: "テストバー" },
		error: overrides?.barInsertError ?? null,
	});
	const barSelect = vi.fn().mockReturnValue({ single: barSingle });
	const barInsert = vi.fn().mockReturnValue({ select: barSelect });

	const adminMaybeSingle = vi
		.fn()
		.mockResolvedValue({ data: null, error: null });
	const adminEq = vi.fn().mockReturnValue({ maybeSingle: adminMaybeSingle });
	const adminSelect = vi.fn().mockReturnValue({ eq: adminEq });
	const adminInsert = vi.fn().mockResolvedValue({ error: null });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bars") return { insert: barInsert };
		if (table === "admin_users")
			return { select: adminSelect, insert: adminInsert };
		throw new Error(`unexpected table: ${table}`);
	});

	mockSupabaseRpc.mockResolvedValue({ error: overrides?.rpcError ?? null });

	return { barInsert, adminInsert };
}

const validPhase1 = {
	bar_manage_id: "test-bar",
	password: "password123",
	contact_email: "owner@example.com",
	contact_phone: "09012345678",
};

describe("POST /api/bars 営業時間同期", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
	});

	it("営業時間 RPC が error を返した場合は 500 を返し、レスポンスに barId を含む", async () => {
		setupSupabaseMocks({ rpcError: { message: "sync failed" } });

		const response = await POST(
			createMockRequest({
				...validPhase1,
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
		);

		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.barId).toBe(42);
	});

	it("営業時間が不正（day_of_week 範囲外）な場合は 400 を返し、bars の insert すら呼ばれない", async () => {
		const { barInsert } = setupSupabaseMocks();

		const response = await POST(
			createMockRequest({
				...validPhase1,
				name: "テストバー",
				opening_hours: [
					{
						day_of_week: 7,
						open_time: "17:00",
						close_time: "23:00",
						sort_order: 0,
						is_closed: false,
					},
				],
			}),
		);

		expect(response.status).toBe(400);
		expect(mockSupabaseFrom).not.toHaveBeenCalledWith("bars");
		expect(barInsert).not.toHaveBeenCalled();
		expect(mockSupabaseRpc).not.toHaveBeenCalled();
	});

	it("時刻が不正形式（25:00）な場合は 400 を返し、bars の insert すら呼ばれない", async () => {
		const { barInsert } = setupSupabaseMocks();

		const response = await POST(
			createMockRequest({
				...validPhase1,
				name: "テストバー",
				opening_hours: [
					{
						day_of_week: 0,
						open_time: "25:00",
						close_time: "23:00",
						sort_order: 0,
						is_closed: false,
					},
				],
			}),
		);

		expect(response.status).toBe(400);
		expect(barInsert).not.toHaveBeenCalled();
		expect(mockSupabaseRpc).not.toHaveBeenCalled();
	});

	it("営業時間が正常な場合は 201 を返し、整形済みデータを RPC に委譲する", async () => {
		setupSupabaseMocks();

		const response = await POST(
			createMockRequest({
				...validPhase1,
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
		);

		expect(response.status).toBe(201);
		expect(mockSupabaseRpc).toHaveBeenCalledWith("sync_bar_opening_hours", {
			p_bar_id: 42,
			p_opening_hours: [
				{
					day_of_week: 0,
					open_time: "17:00:00",
					close_time: "23:00:00",
					sort_order: 0,
					is_closed: false,
				},
			],
		});
	});
});
