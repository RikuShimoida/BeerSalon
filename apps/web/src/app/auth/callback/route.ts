import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url);
	const token_hash = requestUrl.searchParams.get("token_hash");
	const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
	const next = requestUrl.searchParams.get("next") || "/signup/profile";

	if (token_hash && type) {
		const supabase = await createClient();
		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});

		if (error) {
			console.error("[Auth Callback] Failed to verify OTP:", error);
			return NextResponse.redirect(
				new URL(
					`/signup/profile?error=${encodeURIComponent(error.message)}`,
					request.url,
				),
			);
		}
	}

	return NextResponse.redirect(new URL(next, request.url));
}
