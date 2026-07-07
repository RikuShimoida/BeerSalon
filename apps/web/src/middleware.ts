import { logRequest } from "@beersalon/shared";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	logRequest(request);

	const { pathname } = request.nextUrl;

	const publicExactPaths = ["/login", "/signup"];
	const publicPrefixPaths = ["/password/reset", "/auth/callback"];
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

	// Why not: DATABASE_URL は Prisma 用のサーバー変数で middleware では未使用。
	// 必須チェックに含めると、Edge ランタイムに DATABASE_URL が渡らない環境で
	// 全リクエストが throw し、全ページが「This page couldn't load」で閲覧不能になる。
	if (!url || !anonKey) {
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

	// Why not: getUser() は Supabase 認証サーバーへ HTTP アクセスするため、参照先が
	// 到達不可（例: 開発環境用 URL を preview/本番に設定）だと fetch 例外で middleware
	// 全体が 500 に落ち、全ページが「This page couldn't load」になる。例外時は未認証と
	// して扱い、最低限ログインページへ誘導して画面を表示できる状態を保つ。
	let user: User | null = null;
	try {
		const {
			data: { user: fetchedUser },
		} = await supabase.auth.getUser();
		user = fetchedUser;
	} catch (error) {
		console.warn(
			"[middleware] failed to fetch user, treating as unauthenticated",
			{
				pathname,
				error: error instanceof Error ? error.message : String(error),
			},
		);
	}

	if (user && (pathname === "/login" || pathname === "/signup")) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	if (!user && !isPublicPath) {
		const redirectTo = isSignupSubPath ? "/signup" : "/login";
		return NextResponse.redirect(new URL(redirectTo, request.url));
	}

	if (user && !pathname.startsWith("/signup") && !pathname.startsWith("/api")) {
		try {
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
		} catch (error) {
			// Why not: プロフィール照会が到達不可で throw すると、認証済みユーザーでも
			// 全ページが 500 に落ちる。ここで握って通常表示を優先する（未認証保護は
			// 直前の getUser 判定で担保済み）。
			console.warn("[middleware] failed to query user_profiles", {
				userId: user.id,
				pathname,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
