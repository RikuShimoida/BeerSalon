import { type NextRequest, NextResponse } from "next/server";
import { sendAdminPasswordResetEmail } from "@/lib/email";
import {
	computeExpiresAt,
	generateResetToken,
	NEUTRAL_FORGOT_MESSAGE,
} from "@/lib/password-reset";
import { resolveRequestOrigin } from "@/lib/request-origin";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdminUser } from "@/types/database";

export async function POST(request: NextRequest) {
	try {
		const { barManageId } = await request.json();

		if (!barManageId || typeof barManageId !== "string") {
			return NextResponse.json(
				{ error: "店舗IDを入力してください" },
				{ status: 400 },
			);
		}

		// Why not: ユーザー列挙攻撃を防ぐため、店舗IDの登録有無・contact_email の有無に
		// 関わらず、常に同一の完了メッセージを返す。実際の送信可否は内部で分岐する。
		const { data: user } = await supabaseAdmin
			.from("admin_users")
			.select("id, contact_email, is_active")
			.eq("bar_manage_id", barManageId)
			.eq("is_active", true)
			.single<Pick<AdminUser, "id" | "contact_email" | "is_active">>();

		if (user?.contact_email) {
			const { token, tokenHash } = generateResetToken();
			const expiresAt = computeExpiresAt();

			const { error: insertError } = await supabaseAdmin
				.from("admin_password_reset_tokens")
				.insert({
					admin_user_id: user.id,
					token_hash: tokenHash,
					expires_at: expiresAt.toISOString(),
				});

			// insert 失敗時もクライアントには成功扱いで返す(列挙対策)。サーバーログには残す。
			if (insertError) {
				console.error(
					"[password/forgot] トークンの保存に失敗しました",
					insertError,
				);
			} else {
				const baseUrl = resolveRequestOrigin(request);
				if (baseUrl) {
					await sendAdminPasswordResetEmail({
						to: user.contact_email,
						resetUrl: `${baseUrl}/password/reset?token=${token}`,
					});
				} else {
					console.error(
						"[password/forgot] リクエストオリジンを解決できず、メールリンクを生成できませんでした",
					);
				}
			}
		}

		return NextResponse.json({ message: NEUTRAL_FORGOT_MESSAGE });
	} catch (_error) {
		return NextResponse.json(
			{ error: "リクエストの処理に失敗しました" },
			{ status: 500 },
		);
	}
}
