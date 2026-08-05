import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = vi.fn();
vi.mock("next/headers", () => ({
	headers: () => mockHeaders(),
}));

import { getSiteUrl } from "./site-url";

const createHeaderMap = (entries: Record<string, string>) => ({
	get: (key: string): string | null => entries[key.toLowerCase()] ?? null,
});

// 解決ロジックの網羅は shared の resolveOriginFromHeaders の UT
// （packages/shared/src/request-origin.test.ts）が担う。ここでは getSiteUrl が
// next/headers のヘッダーと web 固有の env 名 / フォールバックをコアへ正しく委譲することを確認する。
describe("getSiteUrl（コアへの委譲）", () => {
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

	it("NEXT_PUBLIC_SITE_URL が設定されていればそれを origin として返す（env 名の注入確認）", async () => {
		process.env.NEXT_PUBLIC_SITE_URL = "https://beersalon.com";
		mockHeaders.mockResolvedValue(createHeaderMap({}));

		expect(await getSiteUrl()).toBe("https://beersalon.com");
	});

	it("env 未設定時は next/headers のヘッダーから組み立てる（ヘッダー取得の委譲確認）", async () => {
		mockHeaders.mockResolvedValue(
			createHeaderMap({ host: "example.vercel.app" }),
		);

		expect(await getSiteUrl()).toBe("https://example.vercel.app");
	});

	it("ヘッダーが何も無ければ web 固有のフォールバック http://localhost:3000 を返す", async () => {
		mockHeaders.mockResolvedValue(createHeaderMap({}));

		expect(await getSiteUrl()).toBe("http://localhost:3000");
	});
});
