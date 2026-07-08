import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = "bar-preview-images";

const MIME_TO_EXTENSION: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

// POST /api/bars/:barId/preview-image - プレビュー画像アップロード
export async function POST(
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

		// FormDataから画像ファイルを取得
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "画像ファイルが選択されていません" },
				{ status: 400 },
			);
		}

		// ファイルサイズチェック
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: "画像サイズは5MB以下にしてください" },
				{ status: 400 },
			);
		}

		// MIMEタイプチェック
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: "画像形式はJPEG、PNG、WebPのみ対応しています" },
				{ status: 400 },
			);
		}

		// ファイル名生成（タイムスタンプベース）
		const timestamp = Date.now();
		const extension = MIME_TO_EXTENSION[file.type] || "jpg";
		const fileName = `bars/${barId}/preview_${timestamp}.${extension}`;

		// 既存の画像を削除
		const { data: existingBar } = await supabaseAdmin
			.from("bars")
			.select("preview_image_url")
			.eq("id", barId)
			.single();

		if (existingBar?.preview_image_url) {
			// URLからファイルパスを抽出
			const url = new URL(existingBar.preview_image_url);
			const pathParts = url.pathname.split("/");
			const existingFileName = pathParts.slice(-3).join("/"); // bars/{barId}/preview_xxx.ext

			// 既存ファイルを削除
			await supabaseAdmin.storage.from(BUCKET_NAME).remove([existingFileName]);
		}

		// 画像をSupabase Storageにアップロード
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
			.from(BUCKET_NAME)
			.upload(fileName, buffer, {
				contentType: file.type,
				upsert: true,
			});

		if (uploadError) {
			// Why not: 詳細をレスポンスに載せると外部の bar_owner に内部情報が露出するため、真因はサーバーログにのみ残す
			console.error("[preview-image] storage upload failed:", uploadError);
			return NextResponse.json(
				{ error: "画像のアップロードに失敗しました" },
				{ status: 500 },
			);
		}

		// 公開URLを取得
		const { data: publicUrlData } = supabaseAdmin.storage
			.from(BUCKET_NAME)
			.getPublicUrl(uploadData.path);

		const previewImageUrl = publicUrlData.publicUrl;

		// DBにpreview_image_urlを保存
		const { error: updateError } = await supabaseAdmin
			.from("bars")
			.update({ preview_image_url: previewImageUrl })
			.eq("id", barId);

		if (updateError) {
			console.error("[preview-image] db update failed:", updateError);
			return NextResponse.json(
				{ error: "データベースの更新に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			preview_image_url: previewImageUrl,
		});
	} catch (error) {
		console.error("[preview-image] unexpected error:", error);
		return NextResponse.json(
			{ error: "画像のアップロードに失敗しました" },
			{ status: 500 },
		);
	}
}

// DELETE /api/bars/:barId/preview-image - プレビュー画像削除
export async function DELETE(
	_request: NextRequest,
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

		// 既存の画像URLを取得
		const { data: bar } = await supabaseAdmin
			.from("bars")
			.select("preview_image_url")
			.eq("id", barId)
			.single();

		if (!bar?.preview_image_url) {
			return NextResponse.json(
				{ error: "削除する画像がありません" },
				{ status: 404 },
			);
		}

		// URLからファイルパスを抽出
		const url = new URL(bar.preview_image_url);
		const pathParts = url.pathname.split("/");
		const fileName = pathParts.slice(-3).join("/"); // bars/{barId}/preview_xxx.ext

		// Supabase Storageから画像を削除
		const { error: deleteError } = await supabaseAdmin.storage
			.from(BUCKET_NAME)
			.remove([fileName]);

		if (deleteError) {
			console.error("Storage delete failed:", deleteError);
		}

		// DBのpreview_image_urlをNULLに更新
		const { error: updateError } = await supabaseAdmin
			.from("bars")
			.update({ preview_image_url: null })
			.eq("id", barId);

		if (updateError) {
			console.error("[preview-image] delete db update failed:", updateError);
			return NextResponse.json(
				{ error: "データベースの更新に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[preview-image] delete unexpected error:", error);
		return NextResponse.json(
			{ error: "画像の削除に失敗しました" },
			{ status: 500 },
		);
	}
}
