import { supabaseAdmin } from "./supabase";

export interface BarDashboardMetrics {
	viewCount: number;
	favoriteCount: number;
	articleLikeCount: number;
	postCount: number;
}

// Why not: 各テーブルを個別に select("*") してから length を数える方式は、行本体を転送するため
// 集計目的には無駄が大きい。head: true + count: "exact" でボディを返さず件数のみ取得する。
async function countByBar(
	table: "view_histories" | "favorite_bars" | "posts",
	barId: number,
): Promise<number> {
	const { count } = await supabaseAdmin
		.from(table)
		.select("*", { count: "exact", head: true })
		.eq("bar_id", barId);

	return count ?? 0;
}

// Why not: article_likes 自体は bar_id を持たない。対象記事IDを別クエリで集めてから in で数える2段方式は
// 記事数に比例してIDリストが膨らむため、articles を内部結合して 1 クエリで自店分だけに絞る。
async function countArticleLikesByBar(barId: number): Promise<number> {
	const { count } = await supabaseAdmin
		.from("article_likes")
		.select("*, articles!inner(bar_id)", { count: "exact", head: true })
		.eq("articles.bar_id", barId);

	return count ?? 0;
}

export async function getBarDashboardMetrics(
	barId: number,
): Promise<BarDashboardMetrics> {
	const [viewCount, favoriteCount, articleLikeCount, postCount] =
		await Promise.all([
			countByBar("view_histories", barId),
			countByBar("favorite_bars", barId),
			countArticleLikesByBar(barId),
			countByBar("posts", barId),
		]);

	return { viewCount, favoriteCount, articleLikeCount, postCount };
}
