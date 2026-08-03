import type { NextRequest } from "next/server";

// Stripe の success/cancel/return URL を「決済元のオリジン」で組むために、
// リクエストヘッダーからオリジンを解決する。
//
// Why not 環境変数固定（ADMIN_BASE_URL）だけで組む:
//   プレビュー環境の ADMIN_BASE_URL は本番ドメインを指す構成のため、
//   環境変数固定だとプレビューで決済しても本番へ戻ってしまう（Issue #528 課題2）。
//   Vercel は背後で x-forwarded-host / x-forwarded-proto を付与するので、
//   これを一次ソースにして「決済元へ戻す」を満たす。
//
// Why not 環境変数フォールバックを完全に撤廃する:
//   ヘッダーが取得できない実行経路（テスト・ローカルの一部）で success_url が
//   壊れるのを避けるため、ヘッダー欠落時のみ環境変数にフォールバックする。
//   両方とも取れない場合のみ null を返し、呼び出し側で 500 にする。
export function resolveRequestOrigin(request: NextRequest): string | null {
	const forwardedHost = request.headers.get("x-forwarded-host");
	const host = forwardedHost ?? request.headers.get("host");

	if (host) {
		// Why not http 固定: プレビュー/本番は https、ローカルは http のため、
		//   プロトコルもヘッダー由来を優先する。取れなければ https を既定にする
		//   （Vercel 上は常に https のため）。
		const proto = request.headers.get("x-forwarded-proto") ?? "https";
		return `${proto}://${host}`;
	}

	const fallback =
		process.env.ADMIN_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
	return fallback || null;
}
