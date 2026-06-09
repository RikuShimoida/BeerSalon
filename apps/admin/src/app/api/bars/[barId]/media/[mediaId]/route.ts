import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET_NAME = "bar-media";

// DELETE /api/bars/:barId/media/:mediaId - メディア削除
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string; mediaId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		const { barId, mediaId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json(
				{ error: "アクセス権限がありません" },
				{ status: 403 },
			);
		}

		const { data: media } = await supabaseAdmin
			.from("bar_images")
			.select("image_url")
			.eq("id", mediaId)
			.eq("bar_id", barId)
			.eq("image_type", "slider")
			.single();

		if (!media) {
			return NextResponse.json(
				{ error: "削除するメディアが見つかりません" },
				{ status: 404 },
			);
		}

		const url = new URL(media.image_url);
		const pathParts = url.pathname.split("/");
		const fileName = pathParts.slice(-3).join("/");

		const { error: deleteError } = await supabaseAdmin.storage
			.from(BUCKET_NAME)
			.remove([fileName]);

		if (deleteError) {
			console.error("Storage delete failed:", deleteError);
		}

		const { error: dbDeleteError } = await supabaseAdmin
			.from("bar_images")
			.delete()
			.eq("id", mediaId)
			.eq("bar_id", barId)
			.eq("image_type", "slider");

		if (dbDeleteError) {
			return NextResponse.json(
				{ error: "データベースの削除に失敗しました" },
				{ status: 500 },
			);
		}

		// sort_orderの連番を再計算
		const { data: remaining } = await supabaseAdmin
			.from("bar_images")
			.select("id")
			.eq("bar_id", barId)
			.eq("image_type", "slider")
			.order("sort_order", { ascending: true });

		if (remaining && remaining.length > 0) {
			for (let i = 0; i < remaining.length; i++) {
				await supabaseAdmin
					.from("bar_images")
					.update({ sort_order: i })
					.eq("id", remaining[i].id);
			}
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json(
			{ error: "メディアの削除に失敗しました" },
			{ status: 500 },
		);
	}
}
