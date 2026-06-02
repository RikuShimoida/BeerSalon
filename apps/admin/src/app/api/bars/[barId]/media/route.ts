import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_MEDIA_COUNT = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const BUCKET_NAME = "bar-media";

// GET /api/bars/:barId/media - メディア一覧取得
export async function GET(
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

		const { data: media, error } = await supabaseAdmin
			.from("bar_images")
			.select("*")
			.eq("bar_id", barId)
			.eq("image_type", "slider")
			.order("sort_order", { ascending: true });

		if (error) {
			return NextResponse.json(
				{ error: "メディアの取得に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			media: media || [],
			total: media?.length || 0,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "メディアの取得に失敗しました" },
			{ status: 500 },
		);
	}
}

// POST /api/bars/:barId/media - メディアアップロード
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

		const { data: existingMedia } = await supabaseAdmin
			.from("bar_images")
			.select("id")
			.eq("bar_id", barId)
			.eq("image_type", "slider");

		if (existingMedia && existingMedia.length >= MAX_MEDIA_COUNT) {
			return NextResponse.json(
				{ error: "スライダー用メディアは最大5枚までです" },
				{ status: 400 },
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "ファイルが選択されていません" },
				{ status: 400 },
			);
		}

		const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
		const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

		if (!isImage && !isVideo) {
			return NextResponse.json(
				{
					error:
						"画像形式はJPEG、PNG、WebP、動画形式はMP4、WebMのみ対応しています",
				},
				{ status: 400 },
			);
		}

		const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
		if (file.size > maxSize) {
			const maxSizeMB = maxSize / (1024 * 1024);
			return NextResponse.json(
				{ error: `ファイルサイズは${maxSizeMB}MB以下にしてください` },
				{ status: 400 },
			);
		}

		const timestamp = Date.now();
		const extension = file.name.split(".").pop();
		const mediaType = isImage ? "image" : "video";
		const fileName = `bars/${barId}/slider_${timestamp}.${extension}`;

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
			.from(BUCKET_NAME)
			.upload(fileName, buffer, {
				contentType: file.type,
				upsert: false,
			});

		if (uploadError) {
			return NextResponse.json(
				{ error: "ファイルのアップロードに失敗しました" },
				{ status: 500 },
			);
		}

		const { data: publicUrlData } = supabaseAdmin.storage
			.from(BUCKET_NAME)
			.getPublicUrl(uploadData.path);

		const mediaUrl = publicUrlData.publicUrl;

		const nextSortOrder = existingMedia?.length || 0;

		const { data: newMedia, error: insertError } = await supabaseAdmin
			.from("bar_images")
			.insert({
				bar_id: parseInt(barId),
				media_type: mediaType,
				image_type: "slider",
				image_url: mediaUrl,
				sort_order: nextSortOrder,
			})
			.select()
			.single();

		if (insertError) {
			await supabaseAdmin.storage.from(BUCKET_NAME).remove([fileName]);
			return NextResponse.json(
				{ error: "データベースの登録に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json(newMedia);
	} catch (error) {
		return NextResponse.json(
			{ error: "ファイルのアップロードに失敗しました" },
			{ status: 500 },
		);
	}
}
