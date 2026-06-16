"use server";

import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export type ForgotPasswordState =
	| { success: true; message: string }
	| { success: false; error: string }
	| undefined;

const NEUTRAL_SUCCESS_MESSAGE =
	"該当アドレスが登録されていればメールを送信しました";

export async function forgotPasswordAction(
	_prevState: ForgotPasswordState,
	formData: FormData,
): Promise<ForgotPasswordState> {
	const email = formData.get("email") as string;

	const result = forgotPasswordSchema.safeParse({ email });
	if (!result.success) {
		return {
			success: false,
			error: result.error.issues[0].message,
		};
	}

	const supabase = await createClient();
	const siteUrl = await getSiteUrl();

	// Why not: ユーザー列挙攻撃を防ぐため、登録有無に関わらず常に同じレスポンスを返す。
	// Supabase 側でエラーが発生してもクライアントには成功扱いで返却する。
	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${siteUrl}/auth/callback?next=/password/reset`,
	});

	return {
		success: true,
		message: NEUTRAL_SUCCESS_MESSAGE,
	};
}
