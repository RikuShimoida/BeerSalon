import { describe, expect, it } from "vitest";
import { decodeJwtRole } from "./jwt-role";

function makeJwt(payload: Record<string, unknown>): string {
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" }),
	).toString("base64url");
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	return `${header}.${body}.signature`;
}

describe("decodeJwtRole", () => {
	it("service_role キーの role を取り出す", () => {
		expect(
			decodeJwtRole(makeJwt({ role: "service_role", iss: "supabase" })),
		).toBe("service_role");
	});

	it("anon キーの role を取り出す（貼り間違い検知に使用）", () => {
		expect(decodeJwtRole(makeJwt({ role: "anon", iss: "supabase" }))).toBe(
			"anon",
		);
	});

	it("role クレームが無い場合は null", () => {
		expect(decodeJwtRole(makeJwt({ iss: "supabase" }))).toBeNull();
	});

	it("role が文字列でない場合は null", () => {
		expect(decodeJwtRole(makeJwt({ role: 123 }))).toBeNull();
	});

	it("JWT形式でない文字列は null（新形式のシークレットキー等で誤警告しないため）", () => {
		expect(decodeJwtRole("sb_secret_xxxxxxxx")).toBeNull();
	});

	it("空文字は null", () => {
		expect(decodeJwtRole("")).toBeNull();
	});

	it("ペイロードが不正なbase64/JSONでも例外を投げず null", () => {
		expect(decodeJwtRole("a.!!!not-base64!!!.c")).toBeNull();
	});
});
