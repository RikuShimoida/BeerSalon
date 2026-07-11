import { logRequest } from "@beersalon/shared";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// /bars/register は未ログインの店舗オーナーがセルフサーブ登録するための公開ページ。
// /bars/[barId] や /bars/new（いずれもログイン必須）より前に startsWith で判定するため、
// より具体的なプレフィックスとして publicPaths に含める。
const publicPaths = ["/login", "/bars/register"];

const MUTATION_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

export async function middleware(request: NextRequest) {
	logRequest(request);

	const { pathname } = request.nextUrl;

	if (publicPaths.some((path) => pathname.startsWith(path))) {
		// /login と /bars/register はどちらもログイン済みなら本来のホームへ戻す（誤ってフォームを見せない）。
		if (
			pathname.startsWith("/login") ||
			pathname.startsWith("/bars/register")
		) {
			const token = request.cookies.get("admin-token")?.value;
			if (token) {
				const payload = await verifyToken(token);
				if (payload) {
					const role = payload.role as "bar_owner" | "admin";
					const userBarId = payload.barId as number | null;
					const url = request.nextUrl.clone();

					if (role === "admin") {
						url.pathname = "/bars";
						return NextResponse.redirect(url);
					}
					if (role === "bar_owner" && userBarId) {
						url.pathname = `/bars/${userBarId}`;
						return NextResponse.redirect(url);
					}
				}
			}
		}
		return NextResponse.next();
	}

	if (pathname.startsWith("/api/")) {
		if (pathname.startsWith("/api/auth/")) {
			return NextResponse.next();
		}
		// セルフサーブ登録は未認証で叩ける公開エンドポイント。
		if (pathname === "/api/bars/register") {
			return NextResponse.next();
		}
		if (pathname === "/api/payment-methods") {
			return NextResponse.next();
		}
		if (pathname.startsWith("/api/webhooks/")) {
			return NextResponse.next();
		}
	}

	const token = request.cookies.get("admin-token")?.value;

	if (!token) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	const payload = await verifyToken(token);
	if (!payload) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	const role = payload.role as "bar_owner" | "admin";
	const userBarId = payload.barId as number | null;

	if (role === "bar_owner") {
		const barPathMatch = pathname.match(/^\/bars\/(\d+)/);
		const apiBarPathMatch = pathname.match(/^\/api\/bars\/(\d+)/);
		const pathBarId = barPathMatch?.[1] || apiBarPathMatch?.[1];

		if (pathname === "/bars" || pathname === "/bars/new") {
			const url = request.nextUrl.clone();
			url.pathname = userBarId ? `/bars/${userBarId}` : "/login";
			return NextResponse.redirect(url);
		}

		if (pathBarId && userBarId && Number(pathBarId) !== userBarId) {
			const url = request.nextUrl.clone();
			url.pathname = `/bars/${userBarId}`;
			return NextResponse.redirect(url);
		}
	}

	if (role === "admin" && MUTATION_METHODS.includes(request.method)) {
		const barSubResourcePattern =
			/^\/api\/bars\/\d+\/(menus|articles|coupons|events)/;
		if (barSubResourcePattern.test(pathname)) {
			return NextResponse.json(
				{ error: "管理者は店舗配下データの変更権限がありません" },
				{ status: 403 },
			);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
