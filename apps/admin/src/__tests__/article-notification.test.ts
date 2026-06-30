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

const mockNotifyFavoriteUsers = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/article-notification", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@/lib/article-notification")>();
	return {
		// shouldNotifyNewArticle は純粋ロジックなので本物を使い、副作用のある通知配信のみモックする
		shouldNotifyNewArticle: actual.shouldNotifyNewArticle,
		notifyFavoriteUsersOfNewArticle: (...args: unknown[]) =>
			mockNotifyFavoriteUsers(...args),
	};
});

import { PUT } from "@/app/api/bars/[barId]/articles/[articleId]/route";
import { POST } from "@/app/api/bars/[barId]/articles/route";
import { shouldNotifyNewArticle } from "@/lib/article-notification";

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
}

function mockUpdateChain(
	result: { data: unknown; error: unknown },
	previousStatus: string | null,
) {
	const single = vi.fn().mockResolvedValue(result);
	const updateSelect = vi.fn().mockReturnValue({ single });
	const eqBar = vi.fn().mockReturnValue({ select: updateSelect });
	const eqId = vi.fn().mockReturnValue({ eq: eqBar });
	const update = vi.fn().mockReturnValue({ eq: eqId });

	const fetchSingle = vi
		.fn()
		.mockResolvedValue({ data: { status: previousStatus }, error: null });
	const fetchIs = vi.fn().mockReturnValue({ single: fetchSingle });
	const fetchEqBar = vi.fn().mockReturnValue({ is: fetchIs });
	const fetchEqId = vi.fn().mockReturnValue({ eq: fetchEqBar });
	const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEqId });

	mockSupabaseFrom.mockReturnValue({ select: fetchSelect, update });
}

describe("shouldNotifyNewArticle（公開遷移判定）", () => {
	it("新規作成で published なら通知対象", () => {
		expect(shouldNotifyNewArticle(null, "published")).toBe(true);
	});

	it("新規作成で draft なら通知対象外", () => {
		expect(shouldNotifyNewArticle(null, "draft")).toBe(false);
	});

	it("新規作成で scheduled なら通知対象外", () => {
		expect(shouldNotifyNewArticle(null, "scheduled")).toBe(false);
	});

	it("draft → published は通知対象", () => {
		expect(shouldNotifyNewArticle("draft", "published")).toBe(true);
	});

	it("scheduled → published は通知対象", () => {
		expect(shouldNotifyNewArticle("scheduled", "published")).toBe(true);
	});

	it("published → published（再保存）は二重通知防止のため通知対象外", () => {
		expect(shouldNotifyNewArticle("published", "published")).toBe(false);
	});

	it("published → draft（非公開化）は通知対象外", () => {
		expect(shouldNotifyNewArticle("published", "draft")).toBe(false);
	});
});

describe("POST 記事作成時の新着記事通知", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("published で作成すると通知配信が呼ばれる", async () => {
		mockInsertChain({ data: { id: 10 }, error: null });

		await POST(
			createMockRequest({
				title: "新メニュー入荷",
				body: "本文",
				status: "published",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(mockNotifyFavoriteUsers).toHaveBeenCalledTimes(1);
		expect(mockNotifyFavoriteUsers).toHaveBeenCalledWith({
			barId: 1,
			articleId: 10,
			articleTitle: "新メニュー入荷",
		});
	});

	it("draft で作成しても通知配信は呼ばれない", async () => {
		mockInsertChain({ data: { id: 11 }, error: null });

		await POST(
			createMockRequest({
				title: "下書き",
				body: "本文",
				status: "draft",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(mockNotifyFavoriteUsers).not.toHaveBeenCalled();
	});
});

describe("PUT 記事編集時の新着記事通知", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("draft → published で通知配信が呼ばれる", async () => {
		mockUpdateChain({ data: { id: 20 }, error: null }, "draft");

		await PUT(
			createMockRequest({
				title: "公開記事",
				body: "本文",
				status: "published",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1", articleId: "20" }) },
		);

		expect(mockNotifyFavoriteUsers).toHaveBeenCalledTimes(1);
		expect(mockNotifyFavoriteUsers).toHaveBeenCalledWith({
			barId: 1,
			articleId: 20,
			articleTitle: "公開記事",
		});
	});

	it("published → published（再保存）では通知配信が呼ばれない", async () => {
		mockUpdateChain({ data: { id: 21 }, error: null }, "published");

		await PUT(
			createMockRequest({
				title: "公開記事の修正",
				body: "本文",
				status: "published",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1", articleId: "21" }) },
		);

		expect(mockNotifyFavoriteUsers).not.toHaveBeenCalled();
	});

	it("draft → draft では通知配信が呼ばれない", async () => {
		mockUpdateChain({ data: { id: 22 }, error: null }, "draft");

		await PUT(
			createMockRequest({
				title: "下書き更新",
				body: "本文",
				status: "draft",
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小モック
			}) as any,
			{ params: Promise.resolve({ barId: "1", articleId: "22" }) },
		);

		expect(mockNotifyFavoriteUsers).not.toHaveBeenCalled();
	});
});
