import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveRequestOrigin } from "./request-origin";

// NextRequest 全体をこしらえる必要はなく、resolveRequestOrigin は headers.get のみ使う。
function makeRequest(headers: Record<string, string>) {
	return {
		headers: new Headers(headers),
	} as Parameters<typeof resolveRequestOrigin>[0];
}

// 解決ロジックの網羅は shared の resolveOriginFromHeaders の UT
// （packages/shared/src/request-origin.test.ts）が担う。ここでは resolveRequestOrigin が
// NextRequest のヘッダーと admin 固有の env 名 / フォールバック（null）をコアへ正しく委譲する
// ことを確認する。
describe("resolveRequestOrigin（コアへの委譲）", () => {
	const originalAdminBaseUrl = process.env.ADMIN_BASE_URL;
	const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

	beforeEach(() => {
		process.env.ADMIN_BASE_URL = "";
		process.env.NEXT_PUBLIC_APP_URL = "";
	});

	afterEach(() => {
		process.env.ADMIN_BASE_URL = originalAdminBaseUrl;
		process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
	});

	it("ADMIN_BASE_URL を最優先で origin として返す（env 名の注入確認）", () => {
		process.env.ADMIN_BASE_URL = "https://beer-salon-admin-develop.vercel.app";
		expect(resolveRequestOrigin(makeRequest({}))).toBe(
			"https://beer-salon-admin-develop.vercel.app",
		);
	});

	it("ADMIN_BASE_URL が無ければ NEXT_PUBLIC_APP_URL にフォールバックする（env の合成順の確認）", () => {
		process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
		expect(resolveRequestOrigin(makeRequest({}))).toBe(
			"https://app.example.com",
		);
	});

	it("env 未設定時は NextRequest のヘッダーから組み立てる（ヘッダー取得の委譲確認）", () => {
		expect(
			resolveRequestOrigin(
				makeRequest({ host: "beer-salon-admin-develop.vercel.app" }),
			),
		).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("env もヘッダーも無ければ admin 固有のフォールバック null を返す", () => {
		expect(resolveRequestOrigin(makeRequest({}))).toBeNull();
	});
});
