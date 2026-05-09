/**
 * Next.js middleware 向けリクエストログユーティリティ（開発環境限定）
 *
 * User-Agent から Playwright（E2E）/ ブラウザ（手動アクセス）を識別し、
 * リクエスト時刻・メソッド・パスをコンソールに出力する。
 */

interface RequestLike {
	method: string;
	nextUrl: { pathname: string };
	headers: { get(name: string): string | null };
}

function identifySource(userAgent: string | null): string {
	if (userAgent && userAgent.includes("Playwright")) {
		return "E2E/Playwright";
	}
	return "Browser";
}

export function logRequest(request: RequestLike): void {
	if (process.env.NODE_ENV !== "development") {
		return;
	}

	const source = identifySource(request.headers.get("user-agent"));
	const timestamp = new Date().toISOString();
	const method = request.method;
	const path = request.nextUrl.pathname;

	console.log(`[${timestamp}] [${source}] ${method} ${path}`);
}
