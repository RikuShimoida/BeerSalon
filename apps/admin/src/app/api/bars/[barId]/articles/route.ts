import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	request: NextRequest,
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
		const { title, body: articleBody, image_url, image_url_2, image_url_3 } = body;

		if (!title || !articleBody) {
			return NextResponse.json(
				{ error: "Title and body are required" },
				{ status: 400 },
			);
		}

		const now = new Date().toISOString();

		const { data, error } = await supabaseAdmin
			.from("articles")
			.insert({
				bar_id: parseInt(barId),
				title,
				body: articleBody,
				image_url: image_url || null,
				image_url_2: image_url_2 || null,
				image_url_3: image_url_3 || null,
				status: "published",
				published_at: now,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json(
				{ error: "Failed to create article" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ article: data }, { status: 201 });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
