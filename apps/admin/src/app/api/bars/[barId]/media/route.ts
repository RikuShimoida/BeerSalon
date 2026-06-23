import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_MEDIA_COUNT = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const BUCKET_NAME = "bar-media";

// スライダー用は bar_images に紐づく店舗メディアだが、メニュー画像は
// bar_beer_menus / bar_food_menus の単一 image_url として保存される別物。
// type で分岐し、メニュー画像は bar_images へ INSERT せず公開URLのみ返す。
const MENU_MEDIA_TYPES = ["beer-menu", "food-menu"] as const;
type MenuMediaType = (typeof MENU_MEDIA_TYPES)[number];

function isMenuMediaType(value: string | null): value is MenuMediaType {
	return MENU_MEDIA_TYPES.includes(value as MenuMediaType);
}

const MIME_TO_EXTENSION: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"video/mp4": "mp4",
	"video/webm": "webm",
};

// GET /api/bars/:barId/media - メディア一覧取得
export async function GET(
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
	} catch (_error) {
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

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const uploadType = formData.get("type");
		const mediaUploadType = typeof uploadType === "string" ? uploadType : null;

		if (!file) {
			return NextResponse.json(
				{ error: "ファイルが選択されていません" },
				{ status: 400 },
			);
		}

		const isMenuMedia = isMenuMediaType(mediaUploadType);

		// スライダー枠の5枚制限はメニュー画像には適用しない。
		// メニュー画像は bar_images とは別テーブルの単一 image_url に保存されるため。
		// Why not: 枚数チェックと後段の nextSortOrder で同一 SELECT を二度走らせない。
		//          スライダー経路でのみ一度だけ取得し、両方で使い回す。
		let existingSliderMedia: { id: number; sort_order: number }[] | null = null;
		if (!isMenuMedia) {
			const { data } = await supabaseAdmin
				.from("bar_images")
				.select("id, sort_order")
				.eq("bar_id", barId)
				.eq("image_type", "slider");
			existingSliderMedia = data;

			if (
				existingSliderMedia &&
				existingSliderMedia.length >= MAX_MEDIA_COUNT
			) {
				return NextResponse.json(
					{ error: "スライダー用メディアは最大5枚までです" },
					{ status: 400 },
				);
			}
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
		const extension = MIME_TO_EXTENSION[file.type] || "bin";
		const mediaType = isImage ? "image" : "video";
		const filePrefix = isMenuMedia ? mediaUploadType : "slider";
		const fileName = `bars/${barId}/${filePrefix}_${timestamp}.${extension}`;

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

		// メニュー画像は bar_images へ INSERT せず、公開URLのみ返す。
		// 呼び出し側（メニュー登録/編集フォーム）が image_url として保存する。
		if (isMenuMedia) {
			return NextResponse.json({ url: mediaUrl });
		}

		const nextSortOrder =
			existingSliderMedia && existingSliderMedia.length > 0
				? Math.max(...existingSliderMedia.map((m) => m.sort_order)) + 1
				: 0;

		const { data: newMedia, error: insertError } = await supabaseAdmin
			.from("bar_images")
			.insert({
				bar_id: parseInt(barId, 10),
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
	} catch (_error) {
		return NextResponse.json(
			{ error: "ファイルのアップロードに失敗しました" },
			{ status: 500 },
		);
	}
}
