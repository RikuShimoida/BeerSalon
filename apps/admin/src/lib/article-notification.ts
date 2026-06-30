import { supabaseAdmin } from "@/lib/supabase";

/**
 * 記事の保存が「新着記事通知を出すべき公開遷移」かどうかを判定する。
 *
 * - 新規作成（previousStatus = null）: 保存後が published なら通知
 * - 編集: 保存前が published 以外 かつ 保存後が published のとき（公開への遷移）のみ通知
 *   既に published の記事を再編集して published のまま保存した場合は二重通知防止のため通知しない
 *
 * scheduled → published のバッチ公開は本リポジトリに存在しないため、
 * 通知トリガーは admin で published として保存された瞬間に限定する。
 */
export function shouldNotifyNewArticle(
	previousStatus: string | null,
	nextStatus: string,
): boolean {
	if (nextStatus !== "published") {
		return false;
	}
	return previousStatus !== "published";
}

/**
 * 記事を公開した店舗を favorite_bars 登録している全ユーザーに
 * type=new_article の通知を insert する。
 *
 * web 側（prisma）ではなく admin 側の既存 DB アクセス流儀（supabaseAdmin）に合わせる。
 * notifications テーブルのカラムは snake_case。
 */
export async function notifyFavoriteUsersOfNewArticle(params: {
	barId: number;
	articleId: number;
	articleTitle: string;
}): Promise<void> {
	const { barId, articleId, articleTitle } = params;

	const { data: bar } = await supabaseAdmin
		.from("bars")
		.select("name")
		.eq("id", barId)
		.single();

	const barName = bar?.name ?? "";

	const { data: favorites } = await supabaseAdmin
		.from("favorite_bars")
		.select("user_id")
		.eq("bar_id", barId);

	if (!favorites || favorites.length === 0) {
		return;
	}

	const rows = favorites.map((favorite) => ({
		user_id: favorite.user_id,
		type: "new_article",
		title: "新着記事",
		message: `${barName}が新しい記事「${articleTitle}」を公開しました`,
		link_url: `/articles/${articleId}`,
		is_read: false,
	}));

	await supabaseAdmin.from("notifications").insert(rows);
}
