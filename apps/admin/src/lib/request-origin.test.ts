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

	it("ADMIN_BASE_URL を最優先で使う（正規化した origin を返す）", () => {
		process.env.ADMIN_BASE_URL = "https://beer-salon-admin-develop.vercel.app";
		const origin = resolveRequestOrigin(makeRequest({}));
		expect(origin).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("ADMIN_BASE_URL は x-forwarded-host より優先される（Host Header Injection 対策）", () => {
		// env が設定されていれば、偽装された forwarded-host は無視される。
		process.env.ADMIN_BASE_URL = "https://beer-salon-admin-develop.vercel.app";
		const origin = resolveRequestOrigin(
			makeRequest({
				"x-forwarded-host": "evil.example.com",
				"x-forwarded-proto": "https",
			}),
		);
		expect(origin).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("ADMIN_BASE_URL が無ければ NEXT_PUBLIC_APP_URL を使う", () => {
		process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com/path";
		const origin = resolveRequestOrigin(makeRequest({}));
		// new URL().origin でパスは落ちる。
		expect(origin).toBe("https://app.example.com");
	});

	it("env が不正なURLなら無視してヘッダー解決にフォールバックする", () => {
		process.env.ADMIN_BASE_URL = "not-a-url";
		const origin = resolveRequestOrigin(
			makeRequest({
				"x-forwarded-host": "beer-salon-admin-develop.vercel.app",
				"x-forwarded-proto": "https",
			}),
		);
		expect(origin).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("env 無し時は x-forwarded-host + proto で組む", () => {
		const origin = resolveRequestOrigin(
			makeRequest({
				"x-forwarded-host": "beer-salon-admin-develop.vercel.app",
				"x-forwarded-proto": "https",
			}),
		);
		expect(origin).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("env 無し・x-forwarded-host 無しなら host を使い、localhost は http を補完する", () => {
		const origin = resolveRequestOrigin(
			makeRequest({ host: "localhost:3001" }),
		);
		expect(origin).toBe("http://localhost:3001");
	});

	it("env 無し・host が非localhost なら https を補完する", () => {
		const origin = resolveRequestOrigin(
			makeRequest({ host: "beer-salon-admin-develop.vercel.app" }),
		);
		expect(origin).toBe("https://beer-salon-admin-develop.vercel.app");
	});

	it("localhost.evil.com のような偽装ホストは localhost 扱いせず https を補完する", () => {
		const origin = resolveRequestOrigin(
			makeRequest({ host: "localhost.evil.com" }),
		);
		expect(origin).toBe("https://localhost.evil.com");
	});

	it("env もヘッダーも無ければ null を返す", () => {
		const origin = resolveRequestOrigin(makeRequest({}));
		expect(origin).toBeNull();
	});
});
