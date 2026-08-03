import type { NextRequest } from "next/server";

const isLocalHost = (host: string): boolean => {
	// Why not startsWith: `localhost.evil.com` のような偽装ホスト名を localhost と誤判定し、
	//   production で誤って http スキームを返す経路を作りうるため、ホスト部分のみ完全一致で判定する。
	const hostname = host.split(":")[0];
	if (hostname === "localhost" || hostname === "127.0.0.1") {
		return true;
	}
	// Why not: IPv6 loopback (`[::1]` または `[::1]:3001`) を扱うため、`[::1]` から始まるかも許可する。
	return host === "[::1]" || host.startsWith("[::1]:");
};

const normalizeEnvUrl = (envUrl: string): string | null => {
	try {
		return new URL(envUrl).origin;
	} catch {
		return null;
	}
};

// Stripe の success/cancel/return URL を組むためのベースURL（origin）を解決する。
//
// 解決順序（apps/web の getSiteUrl と揃える）:
// 1. ADMIN_BASE_URL / NEXT_PUBLIC_APP_URL（最優先。`new URL().origin` で正規化。不正値は無視）
// 2. x-forwarded-host + x-forwarded-proto（Vercel など信頼できる reverse proxy 経由時）
// 3. host ヘッダー（localhost は http、それ以外は https を補完）
// 4. 解決不能なら null（呼び出し側で 500）
//
// Why not ヘッダー最優先（forwarded-host を一次ソースにする）:
//   `x-forwarded-host` はクライアントが偽装しうるため、production で戻り先を乗っ取られる
//   Host Header Injection の経路になる。web 側 getSiteUrl と同じく env を最優先にし、
//   production では env（信頼できる固定値）を必ず設定する運用にする。プレビューで戻り先が
//   本番へ飛ぶ問題（Issue #528 課題2）は、env をプレビュードメインに是正することで解決する。
export function resolveRequestOrigin(request: NextRequest): string | null {
	const envUrl = process.env.ADMIN_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
	if (envUrl) {
		const normalized = normalizeEnvUrl(envUrl);
		if (normalized !== null) {
			return normalized;
		}
		console.warn(
			`[request-origin] ADMIN_BASE_URL / NEXT_PUBLIC_APP_URL の値 "${envUrl}" が不正なURLのため無視します。スキーム (http(s)://) 付きのオリジンを設定してください。`,
		);
	}

	if (process.env.NODE_ENV === "production") {
		console.warn(
			"[request-origin] production では ADMIN_BASE_URL の設定を推奨します（x-forwarded-host 由来の Host Header Injection を防ぐため）。",
		);
	}

	const forwardedHost = request.headers.get("x-forwarded-host");
	const host = forwardedHost ?? request.headers.get("host");

	if (!host) {
		return null;
	}

	const forwardedProto = request.headers.get("x-forwarded-proto");
	const proto = forwardedProto ?? (isLocalHost(host) ? "http" : "https");
	return `${proto}://${host}`;
}
