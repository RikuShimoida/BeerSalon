import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const publicPaths = [
		"/login",
		"/signup",
		"/password/reset",
		"/auth/callback",
	];
	const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

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
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (user && !pathname.startsWith("/signup") && !pathname.startsWith("/api")) {
		const { data } = await supabase
			.from("user_profiles")
			.select("id")
			.eq("user_auth_id", user.id)
			.single();

		if (!data) {
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
