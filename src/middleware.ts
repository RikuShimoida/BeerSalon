import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 認証不要なパス
	const publicPaths = ["/login", "/signup", "/password/reset"];
	const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
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
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// ログイン済みユーザーが認証ページにアクセスした場合はトップページへリダイレクト
	if (user && (pathname === "/login" || pathname === "/signup")) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	// 未ログインユーザーが保護されたページにアクセスした場合はログインページへリダイレクト
	if (!user && !isPublicPath) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * 以下のパスを除外:
		 * - _next/static (静的ファイル)
		 * - _next/image (画像最適化ファイル)
		 * - favicon.ico (ファビコン)
		 * - public配下のファイル (画像など)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
