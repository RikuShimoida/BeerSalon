import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/bars/pending - セルフサーブ登録の審査中店舗一覧（admin 専用）
// 通常の GET /api/bars は is_active=true で公開店舗だけを返すため、承認前（is_active=false）の
// 審査中店舗はこの専用エンドポイントで取得する。
export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		if (user.role !== "admin") {
			return NextResponse.json({ error: "権限がありません" }, { status: 403 });
		}

		const { data: pendingUsers, error } = await supabaseAdmin
			.from("admin_users")
			.select("bar_id, bar_manage_id, contact_email, contact_phone, created_at")
			.eq("approval_status", "pending")
			.eq("role", "bar_owner")
			.not("bar_id", "is", null)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json(
				{ error: "審査中店舗の取得に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json(pendingUsers ?? []);
	} catch (_error) {
		return NextResponse.json(
			{ error: "審査中店舗の取得に失敗しました" },
			{ status: 500 },
		);
	}
}
