import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import { getBarDashboardMetrics } from "./dashboard-metrics";

// テーブルごとに count を返すチェーンを組み立てる。
// - view_histories / favorite_bars / posts: from(table).select(...).eq("bar_id", barId) が { count } を返す
// - article_likes: from(table).select(...).eq("articles.bar_id", barId) が { count } を返す
function buildFrom(counts: {
	view_histories?: number | null;
	favorite_bars?: number | null;
	posts?: number | null;
	article_likes?: number | null;
}) {
	const eqSpies: Record<string, ReturnType<typeof vi.fn>> = {};
	const selectSpies: Record<string, ReturnType<typeof vi.fn>> = {};

	mockSupabaseFrom.mockImplementation((table: string) => {
		const eq = vi
			.fn()
			.mockResolvedValue({ count: counts[table as keyof typeof counts] });
		eqSpies[table] = eq;
		const select = vi.fn().mockReturnValue({ eq });
		selectSpies[table] = select;
		return { select };
	});

	return { eqSpies, selectSpies };
}

describe("getBarDashboardMetrics（自店の反応指標を集計する）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("4指標を各テーブルの count から集計して返す", async () => {
		buildFrom({
			view_histories: 12,
			favorite_bars: 5,
			article_likes: 8,
			posts: 3,
		});

		const metrics = await getBarDashboardMetrics(100001);

		expect(metrics).toEqual({
			viewCount: 12,
			favoriteCount: 5,
			articleLikeCount: 8,
			postCount: 3,
		});
	});

	it("count が null の指標は 0 に正規化する（0件でもエラーにしない）", async () => {
		buildFrom({
			view_histories: null,
			favorite_bars: null,
			article_likes: null,
			posts: null,
		});

		const metrics = await getBarDashboardMetrics(100001);

		expect(metrics).toEqual({
			viewCount: 0,
			favoriteCount: 0,
			articleLikeCount: 0,
			postCount: 0,
		});
	});

	it("bar_id 絞り込みが view_histories / favorite_bars / posts の各クエリに適用される", async () => {
		const { eqSpies } = buildFrom({
			view_histories: 1,
			favorite_bars: 1,
			article_likes: 1,
			posts: 1,
		});

		await getBarDashboardMetrics(100001);

		expect(eqSpies.view_histories).toHaveBeenCalledWith("bar_id", 100001);
		expect(eqSpies.favorite_bars).toHaveBeenCalledWith("bar_id", 100001);
		expect(eqSpies.posts).toHaveBeenCalledWith("bar_id", 100001);
	});

	it("記事いいねは articles を内部結合し articles.bar_id で自店に絞る（認可境界）", async () => {
		const { eqSpies } = buildFrom({
			view_histories: 0,
			favorite_bars: 0,
			article_likes: 7,
			posts: 0,
		});

		await getBarDashboardMetrics(100001);

		expect(eqSpies.article_likes).toHaveBeenCalledWith(
			"articles.bar_id",
			100001,
		);
	});

	it("別の barId を渡すとその店舗のフィルタで集計する（他店データが混入しない）", async () => {
		const { eqSpies } = buildFrom({
			view_histories: 99,
			favorite_bars: 99,
			article_likes: 99,
			posts: 99,
		});

		await getBarDashboardMetrics(200002);

		expect(eqSpies.view_histories).toHaveBeenCalledWith("bar_id", 200002);
		expect(eqSpies.favorite_bars).toHaveBeenCalledWith("bar_id", 200002);
		expect(eqSpies.posts).toHaveBeenCalledWith("bar_id", 200002);
		expect(eqSpies.article_likes).toHaveBeenCalledWith(
			"articles.bar_id",
			200002,
		);
	});

	it("view_histories / favorite_bars / posts は select('*', { count: 'exact', head: true }) で件数のみ取得する（全行転送への退行を防ぐ）", async () => {
		const { selectSpies } = buildFrom({
			view_histories: 1,
			favorite_bars: 1,
			article_likes: 1,
			posts: 1,
		});

		await getBarDashboardMetrics(100001);

		expect(selectSpies.view_histories).toHaveBeenCalledWith("*", {
			count: "exact",
			head: true,
		});
		expect(selectSpies.favorite_bars).toHaveBeenCalledWith("*", {
			count: "exact",
			head: true,
		});
		expect(selectSpies.posts).toHaveBeenCalledWith("*", {
			count: "exact",
			head: true,
		});
	});

	it("article_likes は articles を内部結合しつつ件数のみ取得する（内部結合の欠落と全行転送への退行を防ぐ）", async () => {
		const { selectSpies } = buildFrom({
			view_histories: 1,
			favorite_bars: 1,
			article_likes: 1,
			posts: 1,
		});

		await getBarDashboardMetrics(100001);

		expect(selectSpies.article_likes).toHaveBeenCalledWith(
			"*, articles!inner(bar_id)",
			{ count: "exact", head: true },
		);
	});
});
