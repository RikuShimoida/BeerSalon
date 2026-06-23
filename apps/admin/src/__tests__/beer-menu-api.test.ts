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

import { POST } from "@/app/api/bars/[barId]/menus/beers/route";

// Why not: NextRequest 全体を構築せず、route が使う json() のみを持つ最小モックを
//          NextRequest 型として渡す。as any を各呼び出しに撒かず型吸収を一箇所に閉じる。
function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
	} as unknown as NextRequest;
}

// brewery_name を送らないケースでは beers → bar_beer_menus の順に insert される。
// テーブル名で分岐させ、beers insert の引数を検証できるようにする。
function setupSupabaseMock() {
	const beersInsert = vi.fn().mockReturnValue({
		select: vi.fn().mockReturnValue({
			single: vi.fn().mockResolvedValue({ data: { id: 100 }, error: null }),
		}),
	});
	const barBeerMenusInsert = vi.fn().mockReturnValue({
		select: vi.fn().mockReturnValue({
			single: vi.fn().mockResolvedValue({ data: { id: 200 }, error: null }),
		}),
	});

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "beers") {
			return { insert: beersInsert };
		}
		if (table === "bar_beer_menus") {
			return { insert: barBeerMenusInsert };
		}
		return { insert: vi.fn() };
	});

	return { beersInsert, barBeerMenusInsert };
}

describe("POST /api/bars/[barId]/menus/beers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("ビールカテゴリを指定すると beers insert に送信値どおりの beer_category_id が渡る", async () => {
		const { beersInsert } = setupSupabaseMock();

		const response = await POST(
			createMockRequest({ name: "IPA Revolution", beer_category_id: 5 }),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(beersInsert).toHaveBeenCalledWith(
			expect.objectContaining({ name: "IPA Revolution", beer_category_id: 5 }),
		);
	});

	it("ビールカテゴリ未指定（欠落）の場合は400を返し beers を insert しない", async () => {
		const { beersInsert } = setupSupabaseMock();

		const response = await POST(createMockRequest({ name: "IPA Revolution" }), {
			params: Promise.resolve({ barId: "1" }),
		});

		expect(response.status).toBe(400);
		expect(beersInsert).not.toHaveBeenCalled();
	});

	it("ビールカテゴリが null の場合も400を返し beers を insert しない（ID=1フォールバックが撤去されている）", async () => {
		const { beersInsert } = setupSupabaseMock();

		const response = await POST(
			createMockRequest({ name: "IPA Revolution", beer_category_id: null }),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(beersInsert).not.toHaveBeenCalled();
	});

	it("メニュー名が無い場合は400を返し beers を insert しない", async () => {
		const { beersInsert } = setupSupabaseMock();

		const response = await POST(createMockRequest({ beer_category_id: 5 }), {
			params: Promise.resolve({ barId: "1" }),
		});

		expect(response.status).toBe(400);
		expect(beersInsert).not.toHaveBeenCalled();
	});
});
