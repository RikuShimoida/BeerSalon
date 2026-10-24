import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ResolveOriginOptions,
	resolveOriginFromHeaders,
} from "./request-origin";

// ヘッダー取得コールバックを、キーは小文字で引くマップから生成する。
const createGetHeader =
	(entries: Record<string, string>) =>
	(name: string): string | null =>
		entries[name.toLowerCase()] ?? null;

// web 相当（fallback = デフォルトURL文字列）
const webOptions = (
	envUrl: string | null | undefined,
): ResolveOriginOptions<string> => ({
	envUrl,
	fallback: "http://localhost:3000",
	warnLabel: "site-url",
	envVarName: "NEXT_PUBLIC_SITE_URL",
});

// admin 相当（fallback = null）
const adminOptions = (
	envUrl: string | null | undefined,
): ResolveOriginOptions<null> => ({
	envUrl,
	fallback: null,
	warnLabel: "request-origin",
	envVarName: "ADMIN_BASE_URL / NEXT_PUBLIC_APP_URL",
});

describe("resolveOriginFromHeaders", () => {
	afterEach(() => {
		// Why not: NODE_ENV を直接代入すると Node の型制約で TypeError になるため vi.unstubAllEnvs で復元する。
		vi.unstubAllEnvs();
	});

	describe("env 最優先", () => {
		it("env が設定されていれば origin に正規化して返す（ヘッダーより優先）", () => {
			const url = resolveOriginFromHeaders(
				createGetHeader({ host: "example.com" }),
				webOptions("https://beersalon.com"),
			);
			expect(url).toBe("https://beersalon.com");
		});

		it("env の末尾スラッシュ・パスは origin に正規化される", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({}),
					webOptions("https://beersalon.com/"),
				),
			).toBe("https://beersalon.com");
			expect(
				resolveOriginFromHeaders(
					createGetHeader({}),
					webOptions("https://beersalon.com/some/path"),
				),
			).toBe("https://beersalon.com");
		});

		it("env が偽装 x-forwarded-host より優先される（Host Header Injection 対策）", () => {
			const url = resolveOriginFromHeaders(
				createGetHeader({
					"x-forwarded-host": "evil.example.com",
					"x-forwarded-proto": "https",
				}),
				adminOptions("https://admin.example.com"),
			);
			expect(url).toBe("https://admin.example.com");
		});

		it("env が不正なURLなら warn を出してヘッダー解決にフォールバックする", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const url = resolveOriginFromHeaders(
				createGetHeader({ host: "example.com" }),
				webOptions("not-a-url"),
			);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("NEXT_PUBLIC_SITE_URL"),
			);
			expect(url).toBe("https://example.com");
			warnSpy.mockRestore();
		});
	});

	describe("x-forwarded-host / x-forwarded-proto によるフォールバック", () => {
		it("x-forwarded-host + x-forwarded-proto が揃っていればそれを組み立てる", () => {
			const url = resolveOriginFromHeaders(
				createGetHeader({
					"x-forwarded-host": "example.vercel.app",
					"x-forwarded-proto": "https",
				}),
				webOptions(""),
			);
			expect(url).toBe("https://example.vercel.app");
		});

		it("x-forwarded-host のみ（proto なし）で非localhost なら https を補完する", () => {
			const url = resolveOriginFromHeaders(
				createGetHeader({ "x-forwarded-host": "example.vercel.app" }),
				webOptions(""),
			);
			expect(url).toBe("https://example.vercel.app");
		});

		it("x-forwarded-host が localhost なら http スキームを使う", () => {
			const url = resolveOriginFromHeaders(
				createGetHeader({ "x-forwarded-host": "localhost:3000" }),
				webOptions(""),
			);
			expect(url).toBe("http://localhost:3000");
		});
	});

	describe("host ヘッダーへのフォールバック", () => {
		it("host: localhost:3000 のみで http スキームを使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "localhost:3000" }),
					webOptions(""),
				),
			).toBe("http://localhost:3000");
		});

		it("host: 127.0.0.1 は loopback として http スキームを使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "127.0.0.1:3001" }),
					adminOptions(""),
				),
			).toBe("http://127.0.0.1:3001");
		});

		it("host: example.com のみなら https スキームを使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "example.com" }),
					webOptions(""),
				),
			).toBe("https://example.com");
		});

		it("host: localhost.evil.com は localhost と誤判定せず https を使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "localhost.evil.com" }),
					webOptions(""),
				),
			).toBe("https://localhost.evil.com");
		});

		it("host: 127.0.0.1.evil.com も localhost と誤判定せず https を使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "127.0.0.1.evil.com" }),
					webOptions(""),
				),
			).toBe("https://127.0.0.1.evil.com");
		});

		it("host: [::1] は IPv6 loopback として http スキームを使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "[::1]" }),
					webOptions(""),
				),
			).toBe("http://[::1]");
		});

		it("host: [::1]:3000 も IPv6 loopback として http スキームを使う", () => {
			expect(
				resolveOriginFromHeaders(
					createGetHeader({ host: "[::1]:3000" }),
					webOptions(""),
				),
			).toBe("http://[::1]:3000");
		});
	});

	describe("fallback（host が無い場合）", () => {
		it("web 相当: ヘッダーが何も無ければ fallback の URL 文字列を返す", () => {
			expect(
				resolveOriginFromHeaders(createGetHeader({}), webOptions("")),
			).toBe("http://localhost:3000");
		});

		it("admin 相当: ヘッダーが何も無ければ fallback の null を返す", () => {
			expect(
				resolveOriginFromHeaders(createGetHeader({}), adminOptions("")),
			).toBeNull();
		});
	});

	describe("production での warn", () => {
		it("NODE_ENV=production かつ env 未設定なら warn を出す", () => {
			vi.stubEnv("NODE_ENV", "production");
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			resolveOriginFromHeaders(
				createGetHeader({ host: "example.com" }),
				webOptions(""),
			);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("NEXT_PUBLIC_SITE_URL"),
			);
			warnSpy.mockRestore();
		});

		it("NODE_ENV=production でも env が設定されていれば warn を出さない", () => {
			vi.stubEnv("NODE_ENV", "production");
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			resolveOriginFromHeaders(
				createGetHeader({}),
				webOptions("https://beersalon.com"),
			);
			expect(warnSpy).not.toHaveBeenCalled();
			warnSpy.mockRestore();
		});

		it("NODE_ENV=development では env 未設定でも warn を出さない", () => {
			vi.stubEnv("NODE_ENV", "development");
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			resolveOriginFromHeaders(
				createGetHeader({ host: "localhost:3000" }),
				webOptions(""),
			);
			expect(warnSpy).not.toHaveBeenCalled();
			warnSpy.mockRestore();
		});
	});
});
