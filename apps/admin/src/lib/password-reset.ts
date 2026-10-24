import { createHash, randomBytes } from "node:crypto";

// トークンの有効期限(発行から1時間)。失効後は再設定できない。
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// 登録有無を区別しない完了メッセージ(ユーザー列挙対策)。web の forgot と同方針。
export const NEUTRAL_FORGOT_MESSAGE =
	"入力された店舗IDが登録されていれば、再設定メールを送信しました";

// Why not bcrypt: リセットトークンは検証時に「リンクの平文トークンからハッシュを再計算して
// DB のハッシュと完全一致で引く」必要がある。bcrypt はソルトが埋め込まれ同一入力でも毎回
// 異なるハッシュになるため索引検索できない。決定的な SHA-256 を使い、DB には平文を残さない。
export function generateResetToken(): { token: string; tokenHash: string } {
	const token = randomBytes(32).toString("hex");
	const tokenHash = hashResetToken(token);
	return { token, tokenHash };
}

export function hashResetToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function computeExpiresAt(now: Date = new Date()): Date {
	return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}

// トークンレコードが「使用可能」か判定する。未使用(used_at が空)かつ未失効であること。
export function isTokenUsable(
	record: { usedAt: string | null; expiresAt: string },
	now: Date = new Date(),
): boolean {
	if (record.usedAt !== null) return false;
	return new Date(record.expiresAt).getTime() > now.getTime();
}

// 新パスワードのバリデーション。管理画面の方針は「8文字以上」(ユーザー画面より緩い)。
export function validateNewPassword(password: string): string | null {
	if (!password || password.length < 8) {
		return "パスワードは8文字以上で入力してください";
	}
	return null;
}
