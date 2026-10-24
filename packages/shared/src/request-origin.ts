/**
 * リクエストからオリジン（origin）を動的に解決するコアロジック。
 *
 * web（認証メールのコールバックURL）と admin（Stripe の戻り先URL）で二重実装されていた
 * オリジン解決を一本化する。両アプリでヘッダー取得手段が異なる（web は `next/headers` の
 * async な `headers()`、admin は `NextRequest` 引数）ため、この関数は `next` に依存せず
 * `getHeader: (name) => string | null` コールバックだけを受け取る純粋関数とする
 * （`middleware-logger.ts` の `RequestLike` 方式に倣い、shared を framework 非依存に保つ）。
 *
 * 解決順序:
 * 1. env（最優先。`new URL().origin` で正規化する。不正値は warn を出して無視）
 * 2. `x-forwarded-host` + `x-forwarded-proto`（Vercel など信頼できる reverse proxy 経由時）
 * 3. `host` ヘッダー（localhost は http、それ以外は https を補完）
 * 4. host が無ければ `options.fallback`（web は既定URL、admin は null）
 *
 * production 環境で env が未設定の場合、`x-forwarded-host` 由来の Host Header Injection
 * 攻撃に対する耐性が信頼できる reverse proxy に依存するため、production では env を必ず
 * 設定すること（未設定時は warn を出す）。
 */

const isLocalHost = (host: string): boolean => {
	// Why not startsWith: `localhost.evil.com` のような偽装ホスト名を localhost と誤判定し、
	//   production で誤って http スキームを返す経路を作りうるため、ホスト部分のみ完全一致で判定する。
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

export interface ResolveOriginOptions<TFallback extends string | null> {
	/** env 最優先値。web は `NEXT_PUBLIC_SITE_URL`、admin は `ADMIN_BASE_URL ?? NEXT_PUBLIC_APP_URL`。 */
	envUrl: string | null | undefined;
	/** host が解決できないときの返り値。web は既定URL文字列、admin は null。 */
	fallback: TFallback;
	/** warn メッセージ先頭のラベル（例: "site-url" / "request-origin"）。 */
	warnLabel: string;
	/** env 変数名（warn メッセージ用。例: "NEXT_PUBLIC_SITE_URL"）。 */
	envVarName: string;
}

/**
 * ヘッダー取得コールバックと options から origin を解決する。
 *
 * @param getHeader ヘッダー名（小文字）を受け取り値を返す関数。存在しなければ null。
 * @param options env値・fallback・warnラベルなど web/admin の差分を注入する。
 * @returns 解決した origin 文字列。host が無い場合は `options.fallback`。
 */
export function resolveOriginFromHeaders<TFallback extends string | null>(
	getHeader: (name: string) => string | null,
	options: ResolveOriginOptions<TFallback>,
): string | TFallback {
	const { envUrl, fallback, warnLabel, envVarName } = options;

	if (envUrl && envUrl.length > 0) {
		const normalized = normalizeEnvUrl(envUrl);
		if (normalized !== null) {
			return normalized;
		}
		console.warn(
			`[${warnLabel}] ${envVarName} の値 "${envUrl}" が不正なURLのため無視します。スキーム (http(s)://) 付きのオリジンを設定してください。`,
		);
	}

	if (process.env.NODE_ENV === "production") {
		console.warn(
			`[${warnLabel}] production では ${envVarName} の設定を推奨します（x-forwarded-host 由来の Host Header Injection を防ぐため）。`,
		);
	}

	// Why not: 環境変数で固定値を持たせず動的解決にしているのは、Vercel のプレビュー環境ごとに
	// ドメインが変わるため。env 未設定時はリクエストヘッダーから組み立てる。
	const forwardedHost = getHeader("x-forwarded-host");
	const host = forwardedHost ?? getHeader("host");

	if (!host) {
		return fallback;
	}

	const forwardedProto = getHeader("x-forwarded-proto");
	const protocol = forwardedProto ?? (isLocalHost(host) ? "http" : "https");

	return `${protocol}://${host}`;
}
