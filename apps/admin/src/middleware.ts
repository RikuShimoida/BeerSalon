import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const publicPaths = ["/login"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 公開パスはスキップ
	if (publicPaths.some((path) => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	// APIルートは別途チェック
	if (pathname.startsWith("/api/")) {
		// /api/auth/* は認証不要
		if (pathname.startsWith("/api/auth/")) {
			return NextResponse.next();
		}
		// /api/payment-methods は認証不要（マスタデータ）
		if (pathname === "/api/payment-methods") {
			return NextResponse.next();
		}
		// その他のAPIは認証チェック
		// （将来的に実装）
	}

	// トークン取得
	const token = request.cookies.get("admin-token")?.value;

	// トークンがない場合はログインページへリダイレクト
	if (!token) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// トークン検証
	const payload = await verifyToken(token);
	if (!payload) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// 管理者専用ページのチェック
	if (pathname.startsWith("/admin/")) {
		if (payload.role !== "admin") {
			return NextResponse.json(
				{ error: "アクセス権限がありません" },
				{ status: 403 },
			);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
