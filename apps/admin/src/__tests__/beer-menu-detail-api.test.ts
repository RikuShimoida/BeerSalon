import type { NextRequest } from "next/server";
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

import { PUT } from "@/app/api/bars/[barId]/menus/beers/[menuId]/route";

// Why not: NextRequest 全体を構築せず、route が使う json() のみを持つ最小モックを
//          NextRequest 型として渡す。
function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
	} as unknown as NextRequest;
}

// PUT は bar_beer_menus を update（beer_id を含む行を返す）した後、
// 関連する beers を update する。テーブル名で分岐し beers.update の引数を検証する。
function setupSupabaseMock() {
	const menuSingle = vi
		.fn()
		.mockResolvedValue({ data: { id: 200, beer_id: 100 }, error: null });
	const barBeerMenusUpdate = vi.fn().mockReturnValue({
		eq: vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({ single: menuSingle }),
			}),
		}),
	});

	const beersUpdate = vi.fn().mockReturnValue({
		eq: vi.fn().mockResolvedValue({ error: null }),
	});

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bar_beer_menus") {
			return { update: barBeerMenusUpdate };
		}
		if (table === "beers") {
			return { update: beersUpdate };
		}
		return { update: vi.fn(), delete: vi.fn(), insert: vi.fn() };
	});

	return { barBeerMenusUpdate, beersUpdate };
}

describe("PUT /api/bars/[barId]/menus/beers/[menuId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("アルコール度数を指定すると関連 beers が該当値で update される", async () => {
		const { beersUpdate } = setupSupabaseMock();

		const response = await PUT(createMockRequest({ abv: 6.5 }), {
			params: Promise.resolve({ barId: "1", menuId: "200" }),
		});

		expect(response.status).toBe(200);
		expect(beersUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ abv: 6.5 }),
		);
	});

	it("アルコール度数が範囲外（100以上）の場合は400を返し beers を update しない", async () => {
		const { beersUpdate } = setupSupabaseMock();

		const response = await PUT(createMockRequest({ abv: 150 }), {
			params: Promise.resolve({ barId: "1", menuId: "200" }),
		});

		expect(response.status).toBe(400);
		expect(beersUpdate).not.toHaveBeenCalled();
	});

	it("アルコール度数を送らない場合は beers を update しない（既存値を保持）", async () => {
		const { beersUpdate } = setupSupabaseMock();

		const response = await PUT(createMockRequest({ description: "更新" }), {
			params: Promise.resolve({ barId: "1", menuId: "200" }),
		});

		expect(response.status).toBe(200);
		expect(beersUpdate).not.toHaveBeenCalled();
	});
});
