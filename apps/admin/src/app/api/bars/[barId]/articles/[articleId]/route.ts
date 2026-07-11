import { type NextRequest, NextResponse } from "next/server";
import {
	notifyFavoriteUsersOfNewArticle,
	shouldNotifyNewArticle,
} from "@/lib/article-notification";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveArticlePublishing } from "@/lib/validators";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string; articleId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, articleId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: article, error } = await supabaseAdmin
			.from("articles")
			.select("*")
			.eq("id", articleId)
			.eq("bar_id", barId)
			.is("deleted_at", null)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Article not found" },
					{ status: 404 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to fetch article" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ article });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; articleId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, articleId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const {
			title,
			body: articleBody,
			image_url,
			image_url_2,
			image_url_3,
			status,
			published_at,
		} = body;

		if (!title || !articleBody) {
			return NextResponse.json(
				{ error: "Title and body are required" },
				{ status: 400 },
			);
		}

		const publishing = resolveArticlePublishing(
			status ?? "published",
			published_at,
			new Date(),
		);
		if (!publishing.isValid) {
			return NextResponse.json({ error: publishing.error }, { status: 400 });
		}

		// 公開遷移（published 以外 → published）の判定に保存前ステータスを使うため更新前に取得する
		const { data: previousArticle, error: previousArticleError } =
			await supabaseAdmin
				.from("articles")
				.select("status")
				.eq("id", articleId)
				.eq("bar_id", barId)
				.is("deleted_at", null)
				.single();

		if (previousArticleError) {
			if (previousArticleError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Article not found" },
					{ status: 404 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to fetch article" },
				{ status: 500 },
			);
		}

		const { data, error } = await supabaseAdmin
			.from("articles")
			.update({
				title,
				body: articleBody,
				image_url: image_url || null,
				image_url_2: image_url_2 || null,
				image_url_3: image_url_3 || null,
				status: publishing.status,
				published_at: publishing.published_at,
				updated_at: new Date().toISOString(),
			})
			.eq("id", articleId)
			.eq("bar_id", barId)
			.select()
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Article not found" },
					{ status: 404 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to update article" },
				{ status: 500 },
			);
		}

		// 今回の保存で公開へ遷移した場合のみ通知（published のまま再保存では二重通知しない）
		// 通知は記事保存の副次処理。失敗しても記事は保存済みのため、
		// 外側 catch に巻き込んで 500 を返さずログ記録に留めて 200 を返す
		if (
			shouldNotifyNewArticle(previousArticle?.status ?? null, publishing.status)
		) {
			try {
				await notifyFavoriteUsersOfNewArticle({
					barId: parseInt(barId, 10),
					articleId: parseInt(articleId, 10),
					articleTitle: title,
				});
			} catch (notifyError) {
				console.error(
					"Failed to send new_article notifications after article update",
					notifyError,
				);
			}
		}

		return NextResponse.json({ article: data });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string; articleId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, articleId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { error } = await supabaseAdmin
			.from("articles")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", articleId)
			.eq("bar_id", barId);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to delete article" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
