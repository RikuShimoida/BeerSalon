import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logRequest } from "./middleware-logger";

function createMockRequest(overrides: {
	method?: string;
	pathname?: string;
	userAgent?: string | null;
}) {
	return {
		method: overrides.method ?? "GET",
		nextUrl: { pathname: overrides.pathname ?? "/" },
		headers: {
			get(name: string) {
				if (name === "user-agent") {
					return overrides.userAgent ?? null;
				}
				return null;
			},
		},
	};
}

describe("logRequest", () => {
	const originalEnv = process.env.NODE_ENV;
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
		consoleSpy.mockRestore();
	});

	it("development 環境でブラウザアクセス時に [Browser] を含むログが出力される", () => {
		process.env.NODE_ENV = "development";
		const request = createMockRequest({
			method: "GET",
			pathname: "/bars/1",
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
		});

		logRequest(request);

		expect(consoleSpy).toHaveBeenCalledOnce();
		const logOutput = consoleSpy.mock.calls[0][0] as string;
		expect(logOutput).toContain("[Browser]");
		expect(logOutput).toContain("GET");
		expect(logOutput).toContain("/bars/1");
	});

	it("development 環境で Playwright アクセス時に [E2E/Playwright] を含むログが出力される", () => {
		process.env.NODE_ENV = "development";
		const request = createMockRequest({
			method: "POST",
			pathname: "/login",
			userAgent:
				"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Playwright/1.40.0",
		});

		logRequest(request);

		expect(consoleSpy).toHaveBeenCalledOnce();
		const logOutput = consoleSpy.mock.calls[0][0] as string;
		expect(logOutput).toContain("[E2E/Playwright]");
		expect(logOutput).toContain("POST");
		expect(logOutput).toContain("/login");
	});

	it("ログに ISO 8601 形式のタイムスタンプが含まれる", () => {
		process.env.NODE_ENV = "development";
		const request = createMockRequest({ pathname: "/timeline" });

		logRequest(request);

		const logOutput = consoleSpy.mock.calls[0][0] as string;
		expect(logOutput).toMatch(
			/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
		);
	});

	it("production 環境ではログが出力されない", () => {
		process.env.NODE_ENV = "production";
		const request = createMockRequest({ pathname: "/" });

		logRequest(request);

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it("test 環境ではログが出力されない", () => {
		process.env.NODE_ENV = "test";
		const request = createMockRequest({ pathname: "/" });

		logRequest(request);

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it("User-Agent が null の場合は [Browser] として扱われる", () => {
		process.env.NODE_ENV = "development";
		const request = createMockRequest({
			pathname: "/mypage",
			userAgent: null,
		});

		logRequest(request);

		const logOutput = consoleSpy.mock.calls[0][0] as string;
		expect(logOutput).toContain("[Browser]");
	});
});
