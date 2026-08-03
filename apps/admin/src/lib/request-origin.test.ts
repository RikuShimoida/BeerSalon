import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveRequestOrigin } from "./request-origin";

// NextRequest 全体をこしらえる必要はなく、resolveRequestOrigin は headers.get のみ使う。
function makeRequest(headers: Record<string, string>) {
	return {
		headers: new Headers(headers),
	} as Parameters<typeof resolveRequestOrigin>[0];
}

describe("resolveRequestOrigin", () => {
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

	it("x-forwarded-host と x-forwarded-proto から オリジンを組む", () => {
		const origin = resolveRequestOrigin(
			makeRequest({
				"x-forwarded-host": "beer-salon-admin-develop.vercel.app",
				"x-forwarded-proto": "https",
			}),
		);
		expect(origin).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("x-forwarded-proto が無ければ https を既定にする", () => {
		const origin = resolveRequestOrigin(
			makeRequest({ "x-forwarded-host": "example.vercel.app" }),
		);
		expect(origin).toBe("https://example.vercel.app");
	});

	it("x-forwarded-host が無ければ host ヘッダーを使う", () => {
		const origin = resolveRequestOrigin(
			makeRequest({ host: "localhost:3001", "x-forwarded-proto": "http" }),
		);
		expect(origin).toBe("http://localhost:3001");
	});

	it("x-forwarded-host を host より優先する", () => {
		const origin = resolveRequestOrigin(
			makeRequest({
				"x-forwarded-host": "forwarded.vercel.app",
				host: "internal-host",
				"x-forwarded-proto": "https",
			}),
		);
		expect(origin).toBe("https://forwarded.vercel.app");
	});

	it("ホスト系ヘッダーが無ければ ADMIN_BASE_URL にフォールバックする", () => {
		process.env.ADMIN_BASE_URL = "https://beer-salon-admin.vercel.app";
		const origin = resolveRequestOrigin(makeRequest({}));
		expect(origin).toBe("https://beer-salon-admin.vercel.app");
	});

	it("ADMIN_BASE_URL が無ければ NEXT_PUBLIC_APP_URL にフォールバックする", () => {
		process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
		const origin = resolveRequestOrigin(makeRequest({}));
		expect(origin).toBe("https://app.example.com");
	});

	it("ヘッダーも環境変数も無ければ null を返す", () => {
		const origin = resolveRequestOrigin(makeRequest({}));
		expect(origin).toBeNull();
	});
});
