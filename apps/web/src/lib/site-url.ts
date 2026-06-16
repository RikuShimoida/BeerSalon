import { headers } from "next/headers";

const DEFAULT_SITE_URL = "http://localhost:3000";

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

const isLocalHost = (host: string): boolean =>
	host.startsWith("localhost") || host.startsWith("127.0.0.1");

export async function getSiteUrl(): Promise<string> {
	const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
	if (envUrl && envUrl.length > 0) {
		return stripTrailingSlash(envUrl);
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

	return stripTrailingSlash(`${protocol}://${host}`);
}
