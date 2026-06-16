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
	});

	describe("デフォルトフォールバック", () => {
		it("ヘッダーが何も無ければ http://localhost:3000 を返す", async () => {
			mockHeaders.mockResolvedValue(createHeaderMap({}));

			const url = await getSiteUrl();

			expect(url).toBe("http://localhost:3000");
		});
	});
});
