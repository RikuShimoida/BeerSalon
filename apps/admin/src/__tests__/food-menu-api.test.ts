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

import { PUT } from "@/app/api/bars/[barId]/menus/foods/[menuId]/route";
import { POST } from "@/app/api/bars/[barId]/menus/foods/route";

function createMockRequest(body: unknown): { json: () => Promise<unknown> } {
	return {
		json: () => Promise.resolve(body),
	};
}

function mockInsertChain(result: { data: unknown; error: unknown }) {
	const single = vi.fn().mockResolvedValue(result);
	const select = vi.fn().mockReturnValue({ single });
	const insert = vi.fn().mockReturnValue({ select });
	mockSupabaseFrom.mockReturnValue({ insert });
	return { insert, select, single };
}

function mockUpdateChain(result: { data: unknown; error: unknown }) {
	const single = vi.fn().mockResolvedValue(result);
	const select = vi.fn().mockReturnValue({ single });
	const eqMenu = vi.fn().mockReturnValue({ select });
	const eqId = vi.fn().mockReturnValue({ eq: eqMenu });
	const update = vi.fn().mockReturnValue({ eq: eqId });
	mockSupabaseFrom.mockReturnValue({ update });
	return { update };
}

describe("POST /api/bars/[barId]/menus/foods", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("価格を指定すると insert に price が数値で渡る", async () => {
		const { insert } = mockInsertChain({ data: { id: 10 }, error: null });

		const response = await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ name: "唐揚げ", price: 500 }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({ name: "唐揚げ", price: 500 }),
		);
	});

	it("価格未指定（null）の場合は insert の price が null になる", async () => {
		const { insert } = mockInsertChain({ data: { id: 11 }, error: null });

		await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ name: "枝豆", price: null }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({ name: "枝豆", price: null }),
		);
	});

	it("price フィールド自体が未送信でも insert は price: null で成立する", async () => {
		const { insert } = mockInsertChain({ data: { id: 12 }, error: null });

		await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ name: "ポテト" }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({ name: "ポテト", price: null }),
		);
	});

	it("メニュー名が無い場合は400を返し insert しない", async () => {
		const { insert } = mockInsertChain({ data: null, error: null });

		const response = await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ price: 500 }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(insert).not.toHaveBeenCalled();
	});
});

describe("PUT /api/bars/[barId]/menus/foods/[menuId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("価格を指定すると update に price が数値で渡る", async () => {
		const { update } = mockUpdateChain({ data: { id: 10 }, error: null });

		const response = await PUT(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ name: "唐揚げ", price: 800 }) as any,
			{ params: Promise.resolve({ barId: "1", menuId: "10" }) },
		);

		expect(response.status).toBe(200);
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ name: "唐揚げ", price: 800 }),
		);
	});

	it("価格未指定（null）の場合は update の price が null になる", async () => {
		const { update } = mockUpdateChain({ data: { id: 10 }, error: null });

		await PUT(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ name: "唐揚げ", price: null }) as any,
			{ params: Promise.resolve({ barId: "1", menuId: "10" }) },
		);

		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ price: null }),
		);
	});
});
