import { type NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { SHIZUOKA_PREFECTURE } from "@/lib/shizuoka-cities";
import { supabaseAdmin } from "@/lib/supabase";
import type { Bar } from "@/types/database";

// POST /api/bars/register - 店舗オーナーによるセルフサーブ登録（未認証で叩ける公開エンドポイント）
// Why not 既存 POST /api/bars の 403 ガードを緩める: admin 手動作成フロー（Phase 2 含む）と認可ロジックが同居して
// 複雑化するため、Phase 1 項目のみ受け付ける専用の公開エンドポイントとして分離する。
// 作成される店舗は承認まで公開しない（bars.is_active=false / admin_users.approval_status='pending'）。
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { bar_manage_id, password, contact_email, contact_phone } = body;

		if (!bar_manage_id || typeof bar_manage_id !== "string") {
			return NextResponse.json(
				{ error: "店舗IDを入力してください" },
				{ status: 400 },
			);
		}

		const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
		if (!slugPattern.test(bar_manage_id)) {
			return NextResponse.json(
				{
					error:
						"店舗IDは半角英数字とハイフンのみ使用できます（例: fuji-beer-bar）",
				},
				{ status: 400 },
			);
		}

		if (!password || typeof password !== "string" || password.length < 8) {
			return NextResponse.json(
				{ error: "パスワードは8文字以上で入力してください" },
				{ status: 400 },
			);
		}

		if (!contact_email) {
			return NextResponse.json(
				{ error: "メールアドレスを入力してください" },
				{ status: 400 },
			);
		}

		if (!contact_phone) {
			return NextResponse.json(
				{ error: "電話番号を入力してください" },
				{ status: 400 },
			);
		}

		// bar_manage_id の重複チェック（UX フィードバック用の事前チェック。最終的な一意性は UNIQUE 制約が担保する）
		const { data: existingUser } = await supabaseAdmin
			.from("admin_users")
			.select("id")
			.eq("bar_manage_id", bar_manage_id)
			.maybeSingle();

		if (existingUser) {
			return NextResponse.json(
				{ error: "この店舗IDは既に使用されています" },
				{ status: 400 },
			);
		}

		// 承認まで公開しないため is_active=false で作成する。承認時に true へ更新する。
		const now = new Date().toISOString();
		const { data: bar, error: barError } = await supabaseAdmin
			.from("bars")
			.insert({
				name: bar_manage_id,
				prefecture: SHIZUOKA_PREFECTURE,
				city: "",
				address_line1: "",
				is_active: false,
				updated_at: now,
			})
			.select()
			.single<Bar>();

		if (barError || !bar) {
			return NextResponse.json(
				{ error: "店舗の登録に失敗しました" },
				{ status: 500 },
			);
		}

		const passwordHash = await hashPassword(password);
		const { error: adminUserError } = await supabaseAdmin
			.from("admin_users")
			.insert({
				bar_manage_id,
				password_hash: passwordHash,
				name: bar_manage_id,
				role: "bar_owner",
				bar_id: bar.id,
				contact_email,
				contact_phone,
				approval_status: "pending",
			});

		if (adminUserError) {
			// Why not is_active=false へのロールバック: bars は既に is_active=false で作成しているため
			// 状態が変わらず孤児行が残る。作成直後で参照も無いため物理 delete で確実に取り消す。
			await supabaseAdmin.from("bars").delete().eq("id", bar.id);

			// 事前チェックをすり抜けた並行登録（TOCTOU）は UNIQUE 制約違反で弾かれる。
			// これを 500 ではなく「既に使用されています」の 400 に変換して最終的に1件へ収束させる。
			if (adminUserError.code === "23505") {
				return NextResponse.json(
					{ error: "この店舗IDは既に使用されています" },
					{ status: 400 },
				);
			}

			return NextResponse.json(
				{ error: "店舗アカウントの作成に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{ barManageId: bar_manage_id, approvalStatus: "pending" },
			{ status: 201 },
		);
	} catch (_error) {
		return NextResponse.json(
			{ error: "店舗の登録に失敗しました" },
			{ status: 500 },
		);
	}
}
