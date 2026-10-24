import { resolveOriginFromHeaders } from "@beersalon/shared";
import { headers } from "next/headers";

const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * 認証メール（新規登録確認・パスワード再設定）の `emailRedirectTo` / `redirectTo` に
 * 使うベースURL（origin）を動的に解決する。
 *
 * Server Component / Server Action / Route Handler から呼び出し可能（`next/headers` を
 * 利用するためリクエストコンテキストが必要）。リクエスト毎に最新のヘッダーから解決され、
 * キャッシュは行わない。リクエスト内で複数回呼んでも問題ないが、頻繁に呼ぶ場合は
 * 呼び出し元でローカル変数に保持してよい。
 *
 * 解決順序・Host Header Injection 対策は shared の `resolveOriginFromHeaders` に一本化。
 * このラッパーは `next/headers` からのヘッダー取得と、web 固有の env 名 / フォールバック値の
 * 注入だけを担う。
 */
export async function getSiteUrl(): Promise<string> {
	const headerList = await headers();
	return resolveOriginFromHeaders((name) => headerList.get(name), {
		envUrl: process.env.NEXT_PUBLIC_SITE_URL,
		fallback: DEFAULT_SITE_URL,
		warnLabel: "site-url",
		envVarName: "NEXT_PUBLIC_SITE_URL",
	});
}
