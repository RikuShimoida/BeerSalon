import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
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

		if (!canAccessBar(user, barId)) {
			return NextResponse.json(
				{ error: "アクセス権限がありません" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const { mediaIds } = body;

		if (!Array.isArray(mediaIds)) {
			return NextResponse.json(
				{ error: "mediaIdsは配列である必要があります" },
				{ status: 400 },
			);
		}

		if (
			mediaIds.length === 0 ||
			!mediaIds.every(
				(id) => typeof id === "number" && Number.isInteger(id) && id > 0,
			)
		) {
			return NextResponse.json(
				{ error: "mediaIdsは正の整数の配列である必要があります" },
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
				return NextResponse.json(
					{ error: "順序の更新に失敗しました" },
					{ status: 500 },
				);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "順序の更新に失敗しました" },
			{ status: 500 },
		);
	}
}
