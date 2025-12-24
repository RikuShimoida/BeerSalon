import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/signup/profile";

	const supabase = await createClient();

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			return NextResponse.redirect(new URL(next, request.url));
		}
	}

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});

		if (!error) {
			return NextResponse.redirect(new URL(next, request.url));
		}
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		return NextResponse.redirect(new URL(next, request.url));
	}

	return NextResponse.redirect(new URL("/signup?error=auth", request.url));
}
