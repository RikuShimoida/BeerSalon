import { headers } from "next/headers";

const DEFAULT_SITE_URL = "http://localhost:3000";

const isLocalHost = (host: string): boolean => {
	// Why not: startsWith だと `localhost.evil.com` のような偽装ホスト名を localhost と誤判定し、
	// production で誤って http スキームを返す経路を作りうるため、ホスト部分のみ完全一致で判定する。
	const hostname = host.split(":")[0];
	if (hostname === "localhost" || hostname === "127.0.0.1") {
		return true;
	}
	// Why not: IPv6 loopback (`[::1]` または `[::1]:3000`) を扱うため、`[::1]` から始まるかも許可する。
	return host === "[::1]" || host.startsWith("[::1]:");
};

const normalizeEnvUrl = (envUrl: string): string | null => {
	try {
		return new URL(envUrl).origin;
	} catch {
		return null;
	}
};

/**
 * 認証メール（新規登録確認・パスワード再設定）の `emailRedirectTo` / `redirectTo` に
 * 使うベースURL（origin）を動的に解決する。
 *
 * Server Component / Server Action / Route Handler から呼び出し可能（`next/headers` を
 * 利用するためリクエストコンテキストが必要）。リクエスト毎に最新のヘッダーから解決され、
 * キャッシュは行わない。リクエスト内で複数回呼んでも問題ないが、頻繁に呼ぶ場合は
 * 呼び出し元でローカル変数に保持してよい。
 *
 * 解決順序:
 * 1. `NEXT_PUBLIC_SITE_URL`（最優先。`new URL().origin` で正規化する。不正値は無視）
 * 2. `x-forwarded-host` + `x-forwarded-proto`（Vercel など信頼できる reverse proxy 経由時）
 * 3. `host` ヘッダー（localhost は http、それ以外は https を補完）
 * 4. `http://localhost:3000`（デフォルトフォールバック）
 *
 * production 環境で `NEXT_PUBLIC_SITE_URL` が未設定の場合、`x-forwarded-host` 由来の
 * Host Header Injection 攻撃に対する耐性が信頼できる reverse proxy に依存するため、
 * production では `NEXT_PUBLIC_SITE_URL` を必ず設定すること（未設定時は warn を出す）。
 */
export async function getSiteUrl(): Promise<string> {
	const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
	if (envUrl && envUrl.length > 0) {
		const normalized = normalizeEnvUrl(envUrl);
		if (normalized !== null) {
			return normalized;
		}
		console.warn(
			`[site-url] NEXT_PUBLIC_SITE_URL の値 "${envUrl}" が不正なURLのため無視します。スキーム (http(s)://) 付きのオリジンを設定してください。`,
		);
	}

	if (process.env.NODE_ENV === "production") {
		console.warn(
			"[site-url] production では NEXT_PUBLIC_SITE_URL の設定を推奨します（x-forwarded-host 由来の Host Header Injection を防ぐため）。",
		);
	}

	// Why not: 環境変数で固定値を持たせず動的解決にしているのは、Vercel のプレビュー環境ごとに
	// ドメインが変わるため。`NEXT_PUBLIC_SITE_URL` 未設定時はリクエストヘッダーから組み立てる。
	const headerList = await headers();
	const forwardedHost = headerList.get("x-forwarded-host");
	const forwardedProto = headerList.get("x-forwarded-proto");
	const host = forwardedHost ?? headerList.get("host");

	if (!host) {
		return DEFAULT_SITE_URL;
	}

	const protocol = forwardedProto ?? (isLocalHost(host) ? "http" : "https");

	return `${protocol}://${host}`;
}
