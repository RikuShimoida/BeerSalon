import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import { notifyFavoriteUsersOfNewArticle } from "@/lib/article-notification";

describe("notifyFavoriteUsersOfNewArticle（配信対象解決と通知行の組み立て）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("お気に入り登録した全ユーザー分の new_article 通知行を insert する", async () => {
		const insert = vi.fn().mockResolvedValue({ data: null, error: null });

		const barSingle = vi
			.fn()
			.mockResolvedValue({ data: { name: "Fuji Beer Bar" }, error: null });
		const barEq = vi.fn().mockReturnValue({ single: barSingle });
		const barSelect = vi.fn().mockReturnValue({ eq: barEq });

		const favoriteEq = vi.fn().mockResolvedValue({
			data: [{ user_id: "user-a" }, { user_id: "user-b" }],
			error: null,
		});
		const favoriteSelect = vi.fn().mockReturnValue({ eq: favoriteEq });

		mockSupabaseFrom.mockImplementation((table: string) => {
			if (table === "bars") return { select: barSelect };
			if (table === "favorite_bars") return { select: favoriteSelect };
			if (table === "notifications") return { insert };
			throw new Error(`unexpected table: ${table}`);
		});

		await notifyFavoriteUsersOfNewArticle({
			barId: 1,
			articleId: 99,
			articleTitle: "限定IPA入荷",
		});

		expect(insert).toHaveBeenCalledTimes(1);
		expect(insert).toHaveBeenCalledWith([
			{
				user_id: "user-a",
				type: "new_article",
				title: "新着記事",
				message: "Fuji Beer Barが新しい記事「限定IPA入荷」を公開しました",
				link_url: "/articles/99",
				is_read: false,
			},
			{
				user_id: "user-b",
				type: "new_article",
				title: "新着記事",
				message: "Fuji Beer Barが新しい記事「限定IPA入荷」を公開しました",
				link_url: "/articles/99",
				is_read: false,
			},
		]);
	});

	it("お気に入り登録ユーザーが0件なら insert しない", async () => {
		const insert = vi.fn();

		const barSingle = vi
			.fn()
			.mockResolvedValue({ data: { name: "Fuji Beer Bar" }, error: null });
		const barEq = vi.fn().mockReturnValue({ single: barSingle });
		const barSelect = vi.fn().mockReturnValue({ eq: barEq });

		const favoriteEq = vi.fn().mockResolvedValue({ data: [], error: null });
		const favoriteSelect = vi.fn().mockReturnValue({ eq: favoriteEq });

		mockSupabaseFrom.mockImplementation((table: string) => {
			if (table === "bars") return { select: barSelect };
			if (table === "favorite_bars") return { select: favoriteSelect };
			if (table === "notifications") return { insert };
			throw new Error(`unexpected table: ${table}`);
		});

		await notifyFavoriteUsersOfNewArticle({
			barId: 1,
			articleId: 99,
			articleTitle: "限定IPA入荷",
		});

		expect(insert).not.toHaveBeenCalled();
	});

	it("bars 取得が error なら throw する（黙って握りつぶさない）", async () => {
		const barSingle = vi.fn().mockResolvedValue({
			data: null,
			error: { message: "bar fetch failed" },
		});
		const barEq = vi.fn().mockReturnValue({ single: barSingle });
		const barSelect = vi.fn().mockReturnValue({ eq: barEq });

		mockSupabaseFrom.mockImplementation((table: string) => {
			if (table === "bars") return { select: barSelect };
			throw new Error(`unexpected table: ${table}`);
		});

		await expect(
			notifyFavoriteUsersOfNewArticle({
				barId: 1,
				articleId: 99,
				articleTitle: "限定IPA入荷",
			}),
		).rejects.toThrow(/bar fetch failed/);
	});

	it("favorite_bars 取得が error なら throw する（黙って握りつぶさない）", async () => {
		const barSingle = vi
			.fn()
			.mockResolvedValue({ data: { name: "Fuji Beer Bar" }, error: null });
		const barEq = vi.fn().mockReturnValue({ single: barSingle });
		const barSelect = vi.fn().mockReturnValue({ eq: barEq });

		const favoriteEq = vi.fn().mockResolvedValue({
			data: null,
			error: { message: "favorites fetch failed" },
		});
		const favoriteSelect = vi.fn().mockReturnValue({ eq: favoriteEq });

		mockSupabaseFrom.mockImplementation((table: string) => {
			if (table === "bars") return { select: barSelect };
			if (table === "favorite_bars") return { select: favoriteSelect };
			throw new Error(`unexpected table: ${table}`);
		});

		await expect(
			notifyFavoriteUsersOfNewArticle({
				barId: 1,
				articleId: 99,
				articleTitle: "限定IPA入荷",
			}),
		).rejects.toThrow(/favorites fetch failed/);
	});

	it("notifications insert が error なら throw する（黙って握りつぶさない）", async () => {
		const insert = vi
			.fn()
			.mockResolvedValue({ data: null, error: { message: "insert failed" } });

		const barSingle = vi
			.fn()
			.mockResolvedValue({ data: { name: "Fuji Beer Bar" }, error: null });
		const barEq = vi.fn().mockReturnValue({ single: barSingle });
		const barSelect = vi.fn().mockReturnValue({ eq: barEq });

		const favoriteEq = vi
			.fn()
			.mockResolvedValue({ data: [{ user_id: "user-a" }], error: null });
		const favoriteSelect = vi.fn().mockReturnValue({ eq: favoriteEq });

		mockSupabaseFrom.mockImplementation((table: string) => {
			if (table === "bars") return { select: barSelect };
			if (table === "favorite_bars") return { select: favoriteSelect };
			if (table === "notifications") return { insert };
			throw new Error(`unexpected table: ${table}`);
		});

		await expect(
			notifyFavoriteUsersOfNewArticle({
				barId: 1,
				articleId: 99,
				articleTitle: "限定IPA入荷",
			}),
		).rejects.toThrow(/insert failed/);
	});
});
