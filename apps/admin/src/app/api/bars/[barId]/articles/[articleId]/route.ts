import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	request: NextRequest,
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
		const { title, body: articleBody, image_url, image_url_2, image_url_3 } = body;

		if (!title || !articleBody) {
			return NextResponse.json(
				{ error: "Title and body are required" },
				{ status: 400 },
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

		return NextResponse.json({ article: data });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
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
