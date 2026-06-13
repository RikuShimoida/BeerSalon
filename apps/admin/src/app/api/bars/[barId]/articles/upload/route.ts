import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = "bar-media";

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

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "ファイルが選択されていません" },
				{ status: 400 },
			);
		}

		if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: "画像形式はJPEG、PNG、WebPのみ対応しています" },
				{ status: 400 },
			);
		}

		if (file.size > MAX_IMAGE_SIZE) {
			return NextResponse.json(
				{ error: "ファイルサイズは5MB以下にしてください" },
				{ status: 400 },
			);
		}

		const timestamp = Date.now();
		const uuid = crypto.randomUUID();
		const extension = file.name.split(".").pop();
		const fileName = `bars/${barId}/articles/${timestamp}-${uuid}.${extension}`;

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
				{ error: "画像のアップロードに失敗しました" },
				{ status: 500 },
			);
		}

		const { data: publicUrlData } = supabaseAdmin.storage
			.from(BUCKET_NAME)
			.getPublicUrl(uploadData.path);

		return NextResponse.json({ url: publicUrlData.publicUrl });
	} catch (_error) {
		return NextResponse.json(
			{ error: "画像のアップロードに失敗しました" },
			{ status: 500 },
		);
	}
}
