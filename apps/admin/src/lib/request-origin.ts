import { resolveOriginFromHeaders } from "@beersalon/shared";
import type { NextRequest } from "next/server";

// Stripe の success/cancel/return URL を組むためのベースURL（origin）を解決する。
//
// 解決順序・Host Header Injection 対策は shared の `resolveOriginFromHeaders` に一本化
// （web 側 getSiteUrl と同一コア）。このラッパーは `NextRequest` からのヘッダー取得と、
// admin 固有の env 名（ADMIN_BASE_URL ?? NEXT_PUBLIC_APP_URL）/ フォールバック値（null）の
// 注入だけを担う。
//
// Why not ヘッダー最優先（forwarded-host を一次ソースにする）:
//   `x-forwarded-host` はクライアントが偽装しうるため、production で戻り先を乗っ取られる
//   Host Header Injection の経路になる。env を最優先にし、production では env（信頼できる
//   固定値）を必ず設定する運用にする。プレビューで戻り先が本番へ飛ぶ問題（Issue #528 課題2）は、
//   env をプレビュードメインに是正することで解決する。
export function resolveRequestOrigin(request: NextRequest): string | null {
	return resolveOriginFromHeaders((name) => request.headers.get(name), {
		envUrl: process.env.ADMIN_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
		fallback: null,
		warnLabel: "request-origin",
		envVarName: "ADMIN_BASE_URL / NEXT_PUBLIC_APP_URL",
	});
}
