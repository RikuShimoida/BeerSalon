import { logRequest } from "@beersalon/shared";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	logRequest(request);

	const { pathname } = request.nextUrl;

	const publicExactPaths = ["/login", "/signup"];
	const publicPrefixPaths = [
		"/password/forgot",
		"/password/reset",
		"/auth/callback",
	];
	const isPublicPath =
		publicExactPaths.includes(pathname) ||
		publicPrefixPaths.some((path) => pathname.startsWith(path));
	const isSignupSubPath =
		pathname.startsWith("/signup/") && pathname !== "/signup";

	let supabaseResponse = NextResponse.next({
		request,
	});

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const databaseUrl = process.env.DATABASE_URL;

	if (!url || !anonKey || !databaseUrl) {
		throw new Error("Missing Supabase environment variables");
	}

	const supabase = createServerClient(url, anonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}
				supabaseResponse = NextResponse.next({
					request,
				});
				for (const { name, value, options } of cookiesToSet) {
					supabaseResponse.cookies.set(name, value, options);
				}
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user && (pathname === "/login" || pathname === "/signup")) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	if (!user && !isPublicPath) {
		const redirectTo = isSignupSubPath ? "/signup" : "/login";
		return NextResponse.redirect(new URL(redirectTo, request.url));
	}

	if (user && !pathname.startsWith("/signup") && !pathname.startsWith("/api")) {
		const { data, error } = await supabase
			.from("user_profiles")
			.select("id")
			.eq("user_auth_id", user.id)
			.single();

		if (!data) {
			// Why not: error をログ出力しないと、CI 環境で /signup/profile に
			// リダイレクトされたときに「テーブルが空」なのか「クエリ失敗」なのか
			// 切り分け不能になり、根本原因が追えなくなる。本番でも極稀に
			// Supabase 側で一時的にクエリが失敗した場合の原因特定に必要。
			console.warn(
				"[middleware] user_profiles not found, redirecting to /signup/profile",
				{
					userId: user.id,
					pathname,
					error: error ? { code: error.code, message: error.message } : null,
				},
			);
			return NextResponse.redirect(new URL("/signup/profile", request.url));
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
