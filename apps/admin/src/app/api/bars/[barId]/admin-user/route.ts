import { type NextRequest, NextResponse } from "next/server";
import {
	canAccessBar,
	getCurrentUser,
	hashPassword,
	verifyPassword,
} from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/bars/[barId]/admin-user - admin_user情報取得
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

		const { data: adminUser, error } = await supabaseAdmin
			.from("admin_users")
			.select("bar_manage_id")
			.eq("bar_id", parseInt(barId, 10))
			.eq("role", "bar_owner")
			.maybeSingle();

		if (error || !adminUser) {
			return NextResponse.json(
				{ error: "管理ユーザーが見つかりません" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			bar_manage_id: adminUser.bar_manage_id,
		});
	} catch (_error) {
		return NextResponse.json(
			{ error: "管理ユーザー情報の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

// PUT /api/bars/[barId]/admin-user - 店舗ID変更 or パスワード変更
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

		// admin_userを取得
		const { data: adminUser, error: fetchError } = await supabaseAdmin
			.from("admin_users")
			.select("*")
			.eq("bar_id", parseInt(barId, 10))
			.eq("role", "bar_owner")
			.maybeSingle();

		if (fetchError || !adminUser) {
			return NextResponse.json(
				{ error: "管理ユーザーが見つかりません" },
				{ status: 404 },
			);
		}

		// 店舗ID変更
		if (body.bar_manage_id) {
			const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
			if (!slugPattern.test(body.bar_manage_id)) {
				return NextResponse.json(
					{ error: "店舗IDは半角英数字とハイフンのみ使用できます" },
					{ status: 400 },
				);
			}

			// 重複チェック
			const { data: existing } = await supabaseAdmin
				.from("admin_users")
				.select("id")
				.eq("bar_manage_id", body.bar_manage_id)
				.neq("id", adminUser.id)
				.maybeSingle();

			if (existing) {
				return NextResponse.json(
					{ error: "この店舗IDは既に使用されています" },
					{ status: 400 },
				);
			}

			const { error: updateError } = await supabaseAdmin
				.from("admin_users")
				.update({
					bar_manage_id: body.bar_manage_id,
					updated_at: new Date().toISOString(),
				})
				.eq("id", adminUser.id);

			if (updateError) {
				return NextResponse.json(
					{ error: "店舗IDの変更に失敗しました" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ success: true });
		}

		// パスワード変更
		if (body.new_password) {
			if (!body.current_password) {
				return NextResponse.json(
					{ error: "現在のパスワードを入力してください" },
					{ status: 400 },
				);
			}

			const isValid = await verifyPassword(
				body.current_password,
				adminUser.password_hash,
			);

			if (!isValid) {
				return NextResponse.json(
					{ error: "現在のパスワードが正しくありません" },
					{ status: 400 },
				);
			}

			if (body.new_password.length < 8) {
				return NextResponse.json(
					{ error: "新しいパスワードは8文字以上で入力してください" },
					{ status: 400 },
				);
			}

			const newHash = await hashPassword(body.new_password);

			const { error: updateError } = await supabaseAdmin
				.from("admin_users")
				.update({
					password_hash: newHash,
					updated_at: new Date().toISOString(),
				})
				.eq("id", adminUser.id);

			if (updateError) {
				return NextResponse.json(
					{ error: "パスワードの変更に失敗しました" },
					{ status: 500 },
				);
			}

			return NextResponse.json({ success: true });
		}

		return NextResponse.json(
			{ error: "更新する項目が指定されていません" },
			{ status: 400 },
		);
	} catch (_error) {
		return NextResponse.json(
			{ error: "管理ユーザー情報の更新に失敗しました" },
			{ status: 500 },
		);
	}
}
