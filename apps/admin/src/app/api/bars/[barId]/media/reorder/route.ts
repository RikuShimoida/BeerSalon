import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// PUT /api/bars/:barId/media/reorder - メディア順序変更
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		const { barId } = await params;

		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("*")
				.eq("bar_id", barId)
				.eq("admin_user_id", user.id)
				.single();

			if (!barOwner) {
				return NextResponse.json(
					{ error: "アクセス権限がありません" },
					{ status: 403 },
				);
			}
		}

		const body = await request.json();
		const { mediaIds } = body;

		if (!Array.isArray(mediaIds)) {
			return NextResponse.json(
				{ error: "mediaIdsは配列である必要があります" },
				{ status: 400 },
			);
		}

		for (let i = 0; i < mediaIds.length; i++) {
			const mediaId = mediaIds[i];
			const { error } = await supabaseAdmin
				.from("bar_images")
				.update({ sort_order: i })
				.eq("id", mediaId)
				.eq("bar_id", barId)
				.eq("image_type", "slider");

			if (error) {
				console.error(`Sort order update error for media ${mediaId}:`, error);
				return NextResponse.json(
					{ error: "順序の更新に失敗しました" },
					{ status: 500 },
				);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Media reorder error:", error);
		return NextResponse.json(
			{ error: "順序の更新に失敗しました" },
			{ status: 500 },
		);
	}
}
