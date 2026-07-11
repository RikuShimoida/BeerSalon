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

// 通知生成は article-notification.test.ts で検証するため、ここでは副作用を切り離す
const mockShouldNotifyNewArticle = vi.fn().mockReturnValue(false);
const mockNotifyFavoriteUsers = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/article-notification", () => ({
	shouldNotifyNewArticle: (...args: unknown[]) =>
		mockShouldNotifyNewArticle(...args),
	notifyFavoriteUsersOfNewArticle: (...args: unknown[]) =>
		mockNotifyFavoriteUsers(...args),
}));

import { PUT } from "@/app/api/bars/[barId]/articles/[articleId]/route";
import { POST } from "@/app/api/bars/[barId]/articles/route";

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

function mockUpdateChain(
	result: { data: unknown; error: unknown },
	previousStatus: string | null = "draft",
) {
	const single = vi.fn().mockResolvedValue(result);
	const updateSelect = vi.fn().mockReturnValue({ single });
	const eqBar = vi.fn().mockReturnValue({ select: updateSelect });
	const eqId = vi.fn().mockReturnValue({ eq: eqBar });
	const update = vi.fn().mockReturnValue({ eq: eqId });

	// 更新前の保存前ステータス取得（.select("status").eq().eq().is().single()）に対応する
	const fetchSingle = vi
		.fn()
		.mockResolvedValue({ data: { status: previousStatus }, error: null });
	const fetchIs = vi.fn().mockReturnValue({ single: fetchSingle });
	const fetchEqBar = vi.fn().mockReturnValue({ is: fetchIs });
	const fetchEqId = vi.fn().mockReturnValue({ eq: fetchEqBar });
	const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEqId });

	mockSupabaseFrom.mockReturnValue({ select: fetchSelect, update });
	return { update };
}

describe("POST /api/bars/[barId]/articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("draft 指定で insert に status='draft', published_at=null が渡る", async () => {
		const { insert } = mockInsertChain({ data: { id: 1 }, error: null });

		const response = await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ title: "T", body: "B", status: "draft" }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({ status: "draft", published_at: null }),
		);
	});

	it("published 指定で published_at が自動セットされる", async () => {
		const { insert } = mockInsertChain({ data: { id: 2 }, error: null });

		await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ title: "T", body: "B", status: "published" }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		const insertArg = insert.mock.calls[0][0] as {
			status: string;
			published_at: string | null;
		};
		expect(insertArg.status).toBe("published");
		expect(insertArg.published_at).not.toBeNull();
	});

	it("scheduled + 未来日時で insert に status='scheduled' と指定日時が渡る", async () => {
		const { insert } = mockInsertChain({ data: { id: 3 }, error: null });
		const future = "2099-12-31T10:00:00.000Z";

		const response = await POST(
			createMockRequest({
				title: "T",
				body: "B",
				status: "scheduled",
				published_at: future,
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "scheduled",
				published_at: future,
			}),
		);
	});

	it("scheduled + published_at 未指定は 400 を返し insert しない", async () => {
		const { insert } = mockInsertChain({ data: null, error: null });

		const response = await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ title: "T", body: "B", status: "scheduled" }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(insert).not.toHaveBeenCalled();
	});

	it("scheduled + 過去日時は 400 を返し insert しない", async () => {
		const { insert } = mockInsertChain({ data: null, error: null });

		const response = await POST(
			createMockRequest({
				title: "T",
				body: "B",
				status: "scheduled",
				published_at: "2000-01-01T00:00:00.000Z",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(insert).not.toHaveBeenCalled();
	});

	it("不正な status 文字列は 400 を返し insert しない", async () => {
		const { insert } = mockInsertChain({ data: null, error: null });

		const response = await POST(
			createMockRequest({
				title: "T",
				body: "B",
				status: "archived",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(insert).not.toHaveBeenCalled();
	});

	it("status 未指定なら published として扱う（既存挙動の踏襲）", async () => {
		const { insert } = mockInsertChain({ data: { id: 4 }, error: null });

		await POST(
			// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			createMockRequest({ title: "T", body: "B" }) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({ status: "published" }),
		);
	});
});

describe("PUT /api/bars/[barId]/articles/[articleId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("status / published_at が update 対象に含まれる", async () => {
		const { update } = mockUpdateChain({ data: { id: 1 }, error: null });

		const response = await PUT(
			createMockRequest({
				title: "T",
				body: "B",
				status: "draft",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1", articleId: "1" }) },
		);

		expect(response.status).toBe(200);
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ status: "draft", published_at: null }),
		);
	});

	it("published で渡された published_at を維持する", async () => {
		const { update } = mockUpdateChain({ data: { id: 1 }, error: null });
		const existing = "2026-01-01T09:00:00.000Z";

		await PUT(
			createMockRequest({
				title: "T",
				body: "B",
				status: "published",
				published_at: existing,
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1", articleId: "1" }) },
		);

		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "published",
				published_at: existing,
			}),
		);
	});

	it("scheduled + 過去日時は 400 を返し update しない", async () => {
		const { update } = mockUpdateChain({ data: null, error: null });

		const response = await PUT(
			createMockRequest({
				title: "T",
				body: "B",
				status: "scheduled",
				published_at: "2000-01-01T00:00:00.000Z",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1", articleId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(update).not.toHaveBeenCalled();
	});
});
