import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const token_hash = requestUrl.searchParams.get("token_hash");
	const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
	const isRecovery = type === "recovery";
	const next =
		requestUrl.searchParams.get("next") ||
		(isRecovery ? "/password/reset" : "/signup/profile");

	// Why not: Supabase ホスト型（production / preview）のサインアップ確認メールは
	// PKCE フローの `?code=` で届くため、`token_hash` 分岐だけでは交換されずセッションが
	// 確立しない。`code` を最優先で交換し、新規登録確認フローを成立させる。
	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error(
				"[Auth Callback] Failed to exchange code for session:",
				error,
			);
			if (isRecovery) {
				return NextResponse.redirect(
					new URL("/password/forgot?error=invalid_token", request.url),
				);
			}
			return NextResponse.redirect(
				new URL("/signup?error=invalid_token", request.url),
			);
		}

		return NextResponse.redirect(new URL(next, request.url));
	}

	if (token_hash && type) {
		const supabase = await createClient();
		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});

		if (error) {
			console.error("[Auth Callback] Failed to verify OTP:", error);
			if (isRecovery) {
				return NextResponse.redirect(
					new URL("/password/forgot?error=invalid_token", request.url),
				);
			}
			return NextResponse.redirect(
				new URL("/signup?error=invalid_token", request.url),
			);
		}
	}

	return NextResponse.redirect(new URL(next, request.url));
}
