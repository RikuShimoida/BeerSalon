import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const next = requestUrl.searchParams.get("next");

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.redirect(
			`${requestUrl.origin}/signup?error=${encodeURIComponent("認証に失敗しました")}`,
		);
	}

	const profile = await prisma.userProfile.findUnique({
		where: { userAuthId: user.id },
	});

	if (!profile) {
		return NextResponse.redirect(`${requestUrl.origin}/signup/profile`);
	}

	return NextResponse.redirect(`${requestUrl.origin}${next ?? "/"}`);
}
