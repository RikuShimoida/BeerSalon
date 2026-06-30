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
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: articles, error } = await supabaseAdmin
			.from("articles")
			.select("*")
			.eq("bar_id", barId)
			.is("deleted_at", null)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch articles" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ articles });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId } = await params;

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

		// status 未指定時は published（公開）として扱い、登録時の既存挙動を踏襲する
		const publishing = resolveArticlePublishing(
			status ?? "published",
			published_at,
			new Date(),
		);
		if (!publishing.isValid) {
			return NextResponse.json({ error: publishing.error }, { status: 400 });
		}

		const { data, error } = await supabaseAdmin
			.from("articles")
			.insert({
				bar_id: parseInt(barId, 10),
				title,
				body: articleBody,
				image_url: image_url || null,
				image_url_2: image_url_2 || null,
				image_url_3: image_url_3 || null,
				status: publishing.status,
				published_at: publishing.published_at,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json(
				{ error: "Failed to create article" },
				{ status: 500 },
			);
		}

		// 新規作成では保存前ステータスが存在しないため null を渡す
		if (shouldNotifyNewArticle(null, publishing.status)) {
			await notifyFavoriteUsersOfNewArticle({
				barId: parseInt(barId, 10),
				articleId: data.id,
				articleTitle: title,
			});
		}

		return NextResponse.json({ article: data }, { status: 201 });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
