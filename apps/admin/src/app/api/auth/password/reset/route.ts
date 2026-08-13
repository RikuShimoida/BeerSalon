import { type NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import {
	hashResetToken,
	isTokenUsable,
	validateNewPassword,
} from "@/lib/password-reset";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	try {
		const { token, password } = await request.json();

		if (!token || typeof token !== "string") {
			return NextResponse.json(
				{ error: "再設定リンクが無効です" },
				{ status: 400 },
			);
		}

		const passwordError = validateNewPassword(password);
		if (passwordError) {
			return NextResponse.json({ error: passwordError }, { status: 400 });
		}

		const tokenHash = hashResetToken(token);

		const { data: tokenRecord } = await supabaseAdmin
			.from("admin_password_reset_tokens")
			.select("id, admin_user_id, expires_at, used_at")
			.eq("token_hash", tokenHash)
			.single<{
				id: string;
				admin_user_id: string;
				expires_at: string;
				used_at: string | null;
			}>();

		if (
			!tokenRecord ||
			!isTokenUsable({
				usedAt: tokenRecord.used_at,
				expiresAt: tokenRecord.expires_at,
			})
		) {
			return NextResponse.json(
				{ error: "再設定リンクが無効か、有効期限が切れています" },
				{ status: 400 },
			);
		}

		const passwordHash = await hashPassword(password);

		const { error: updateError } = await supabaseAdmin
			.from("admin_users")
			.update({ password_hash: passwordHash })
			.eq("id", tokenRecord.admin_user_id);

		if (updateError) {
			console.error(
				"[password/reset] パスワードの更新に失敗しました",
				updateError,
			);
			return NextResponse.json(
				{ error: "パスワードの更新に失敗しました" },
				{ status: 500 },
			);
		}

		// Why not: 更新成功後にトークンを使用済みにする。先に used_at を立てると、更新が
		// 失敗したときにトークンだけ失効してユーザーが再申請を強いられる。
		await supabaseAdmin
			.from("admin_password_reset_tokens")
			.update({ used_at: new Date().toISOString() })
			.eq("id", tokenRecord.id);

		return NextResponse.json({ message: "パスワードを再設定しました" });
	} catch (_error) {
		return NextResponse.json(
			{ error: "リクエストの処理に失敗しました" },
			{ status: 500 },
		);
	}
}
