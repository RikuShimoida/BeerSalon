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
// regular_holiday の保存ロジック検証に集中する。
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
import { PUT } from "@/app/api/bars/[barId]/route";

function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
		// biome-ignore lint/suspicious/noExplicitAny: PUT が参照する json のみを持つ最小モック
	} as any;
}

/**
 * bars PUT は bars テーブルを update する。update に渡した値を観測できるよう、
 * barUpdate モックを返す。
 */
function setupSupabaseMocks() {
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

	mockSupabaseRpc.mockResolvedValue({ error: null });

	return { barUpdate };
}

describe("PUT /api/bars/[barId] 定休日補足（regular_holiday）保存", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("regular_holiday を渡すと bars の update に regular_holiday が渡る", async () => {
		const { barUpdate } = setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				regular_holiday: "祝日は営業 / 年末年始休業",
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(barUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				regular_holiday: "祝日は営業 / 年末年始休業",
			}),
		);
	});

	it("regular_holiday を送らない場合は null で update される", async () => {
		const { barUpdate } = setupSupabaseMocks();

		const response = await PUT(createMockRequest({ name: "テストバー" }), {
			params: Promise.resolve({ barId: "5" }),
		});

		expect(response.status).toBe(200);
		expect(barUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ regular_holiday: null }),
		);
	});

	it("regular_holiday が空文字の場合は null で update される", async () => {
		const { barUpdate } = setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				regular_holiday: "",
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(barUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ regular_holiday: null }),
		);
	});

	it("regular_holiday に null を渡すと null で update される（クリア）", async () => {
		const { barUpdate } = setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				regular_holiday: null,
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(barUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ regular_holiday: null }),
		);
	});
});
