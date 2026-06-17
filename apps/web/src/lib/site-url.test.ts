import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = vi.fn();
vi.mock("next/headers", () => ({
	headers: () => mockHeaders(),
}));

import { getSiteUrl } from "./site-url";

const createHeaderMap = (entries: Record<string, string>) => ({
	get: (key: string): string | null => entries[key.toLowerCase()] ?? null,
});

describe("getSiteUrl", () => {
	const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_SITE_URL = "";
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			process.env.NEXT_PUBLIC_SITE_URL = "";
		} else {
			process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
		}
		// Why not: NODE_ENV を直接代入すると Node の型制約で TypeError になるため vi.unstubAllEnvs で復元する。
		vi.unstubAllEnvs();
	});

	describe("NEXT_PUBLIC_SITE_URL 優先", () => {
		it("環境変数が設定されていればそれを返す", async () => {
			process.env.NEXT_PUBLIC_SITE_URL = "https://beersalon.com";
			mockHeaders.mockResolvedValue(createHeaderMap({}));

			const url = await getSiteUrl();

			expect(url).toBe("https://beersalon.com");
		});

		it("環境変数の末尾スラッシュは除去される", async () => {
			process.env.NEXT_PUBLIC_SITE_URL = "https://beersalon.com/";
			mockHeaders.mockResolvedValue(createHeaderMap({}));

			const url = await getSiteUrl();

			expect(url).toBe("https://beersalon.com");
		});

		it("環境変数にパスが含まれていても origin に正規化される", async () => {
			process.env.NEXT_PUBLIC_SITE_URL = "https://beersalon.com/some/path";
			mockHeaders.mockResolvedValue(createHeaderMap({}));

			const url = await getSiteUrl();

			expect(url).toBe("https://beersalon.com");
		});

		it("環境変数に不正値が入っていれば warn を出してヘッダー解決にフォールバックする", async () => {
			process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "example.com",
				}),
			);

			const url = await getSiteUrl();

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("NEXT_PUBLIC_SITE_URL"),
			);
			expect(url).toBe("https://example.com");

			warnSpy.mockRestore();
		});
	});

	describe("x-forwarded-host / x-forwarded-proto によるフォールバック", () => {
		it("x-forwarded-host と x-forwarded-proto が揃っていればそれを組み立てる", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					"x-forwarded-host": "example.vercel.app",
					"x-forwarded-proto": "https",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("https://example.vercel.app");
		});

		it("x-forwarded-host のみ（proto なし）で非localhost なら https を補完する", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					"x-forwarded-host": "example.vercel.app",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("https://example.vercel.app");
		});

		it("x-forwarded-host のみで host が localhost なら http スキームを使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					"x-forwarded-host": "localhost:3000",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("http://localhost:3000");
		});
	});

	describe("host ヘッダーへのフォールバック", () => {
		it("host: localhost:3000 のみで http スキームを使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "localhost:3000",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("http://localhost:3000");
		});

		it("host: example.com のみなら https スキームを使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "example.com",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("https://example.com");
		});

		it("host: localhost.evil.com は localhost と誤判定せず https を使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "localhost.evil.com",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("https://localhost.evil.com");
		});

		it("host: 127.0.0.1.evil.com も localhost と誤判定せず https を使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "127.0.0.1.evil.com",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("https://127.0.0.1.evil.com");
		});

		it("host: [::1] は IPv6 loopback として http スキームを使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "[::1]",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("http://[::1]");
		});

		it("host: [::1]:3000 も IPv6 loopback として http スキームを使う", async () => {
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "[::1]:3000",
				}),
			);

			const url = await getSiteUrl();

			expect(url).toBe("http://[::1]:3000");
		});
	});

	describe("デフォルトフォールバック", () => {
		it("ヘッダーが何も無ければ http://localhost:3000 を返す", async () => {
			mockHeaders.mockResolvedValue(createHeaderMap({}));

			const url = await getSiteUrl();

			expect(url).toBe("http://localhost:3000");
		});
	});

	describe("production での warn", () => {
		it("NODE_ENV=production かつ NEXT_PUBLIC_SITE_URL 未設定なら warn を出す", async () => {
			vi.stubEnv("NODE_ENV", "production");
			process.env.NEXT_PUBLIC_SITE_URL = "";
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "example.com",
				}),
			);

			await getSiteUrl();

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("NEXT_PUBLIC_SITE_URL"),
			);

			warnSpy.mockRestore();
		});

		it("NODE_ENV=production でも NEXT_PUBLIC_SITE_URL が設定されていれば warn を出さない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			process.env.NEXT_PUBLIC_SITE_URL = "https://beersalon.com";
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockHeaders.mockResolvedValue(createHeaderMap({}));

			await getSiteUrl();

			expect(warnSpy).not.toHaveBeenCalled();

			warnSpy.mockRestore();
		});

		it("NODE_ENV=development では env 未設定でも warn を出さない", async () => {
			vi.stubEnv("NODE_ENV", "development");
			process.env.NEXT_PUBLIC_SITE_URL = "";
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockHeaders.mockResolvedValue(
				createHeaderMap({
					host: "localhost:3000",
				}),
			);

			await getSiteUrl();

			expect(warnSpy).not.toHaveBeenCalled();

			warnSpy.mockRestore();
		});
	});
});
