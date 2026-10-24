import { describe, expect, it } from "vitest";
import {
	computeExpiresAt,
	generateResetToken,
	hashResetToken,
	isTokenUsable,
	RESET_TOKEN_TTL_MS,
	validateNewPassword,
} from "./password-reset";

describe("generateResetToken", () => {
	it("平文トークンとそのSHA-256ハッシュを返し、ハッシュは hashResetToken と一致する", () => {
		const { token, tokenHash } = generateResetToken();
		expect(token).toMatch(/^[0-9a-f]{64}$/);
		expect(tokenHash).toBe(hashResetToken(token));
	});

	it("呼び出しごとに異なるトークンを生成する", () => {
		const a = generateResetToken();
		const b = generateResetToken();
		expect(a.token).not.toBe(b.token);
		expect(a.tokenHash).not.toBe(b.tokenHash);
	});
});

describe("hashResetToken", () => {
	it("同一入力に対して決定的に同じハッシュを返す（索引検索可能であること）", () => {
		expect(hashResetToken("abc")).toBe(hashResetToken("abc"));
	});

	it("平文をそのまま保持しない（ハッシュ化されている）", () => {
		expect(hashResetToken("secret-token")).not.toBe("secret-token");
	});
});

describe("computeExpiresAt", () => {
	it("基準時刻から TTL 分だけ後の時刻を返す", () => {
		const now = new Date("2026-08-13T00:00:00.000Z");
		const expiresAt = computeExpiresAt(now);
		expect(expiresAt.getTime()).toBe(now.getTime() + RESET_TOKEN_TTL_MS);
	});
});

describe("isTokenUsable", () => {
	const now = new Date("2026-08-13T12:00:00.000Z");

	it("未使用かつ未失効なら使用可能", () => {
		expect(
			isTokenUsable(
				{ usedAt: null, expiresAt: "2026-08-13T12:30:00.000Z" },
				now,
			),
		).toBe(true);
	});

	it("使用済み（used_at あり）なら使用不可（二重使用防止）", () => {
		expect(
			isTokenUsable(
				{
					usedAt: "2026-08-13T11:00:00.000Z",
					expiresAt: "2026-08-13T12:30:00.000Z",
				},
				now,
			),
		).toBe(false);
	});

	it("有効期限切れなら使用不可（失効後は再設定できない）", () => {
		expect(
			isTokenUsable(
				{ usedAt: null, expiresAt: "2026-08-13T11:59:59.000Z" },
				now,
			),
		).toBe(false);
	});

	it("有効期限ちょうどの時刻は使用不可（境界値: 期限は未来である必要がある）", () => {
		expect(
			isTokenUsable(
				{ usedAt: null, expiresAt: "2026-08-13T12:00:00.000Z" },
				now,
			),
		).toBe(false);
	});
});

describe("validateNewPassword", () => {
	it("8文字未満はエラーメッセージを返す", () => {
		expect(validateNewPassword("1234567")).toBe(
			"パスワードは8文字以上で入力してください",
		);
	});

	it("空文字はエラーメッセージを返す", () => {
		expect(validateNewPassword("")).toBe(
			"パスワードは8文字以上で入力してください",
		);
	});

	it("8文字ちょうどは有効（境界値）", () => {
		expect(validateNewPassword("12345678")).toBeNull();
	});

	it("8文字を超える場合は有効", () => {
		expect(validateNewPassword("valid-password")).toBeNull();
	});
});
