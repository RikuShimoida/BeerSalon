// Why not: 署名検証は不要（設定ミス検知用途）。role クレームだけを取り出す軽量デコード
export function decodeJwtRole(token: string): string | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const json = Buffer.from(payload, "base64url").toString("utf8");
		const claims = JSON.parse(json) as { role?: unknown };
		return typeof claims.role === "string" ? claims.role : null;
	} catch {
		return null;
	}
}
