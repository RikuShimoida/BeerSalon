import { describe, expect, it, vi } from "vitest";

vi.mock("@beersalon/shared", () => ({
	logRequest: vi.fn(),
}));

const mockVerifyToken = vi.fn();
vi.mock("@/lib/auth", () => ({
	verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

import { middleware } from "@/middleware";

function createMockRequest(
	pathname: string,
	cookies: Record<string, string> = {},
	method = "GET",
) {
	const url = new URL(`http://localhost:3001${pathname}`);
	return {
		method,
		nextUrl: Object.assign(url, {
			clone: () => new URL(url.toString()),
		}),
		cookies: {
			get: (name: string) => {
				const value = cookies[name];
				return value ? { name, value } : undefined;
			},
		},
		url: url.toString(),
	} as unknown as Parameters<typeof middleware>[0];
}

describe("middleware: /login redirect for authenticated users", () => {
	it("未ログイン状態で /login にアクセスした場合、そのまま表示される", async () => {
		const request = createMockRequest("/login");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("admin ロールのユーザーがログイン済みで /login にアクセスした場合、/bars へリダイレクトされる", async () => {
		mockVerifyToken.mockResolvedValue({
			role: "admin",
			barId: null,
		});

		const request = createMockRequest("/login", {
			"admin-token": "valid-admin-token",
		});
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/bars");
		expect(response.headers.get("location")).not.toContain("/bars/");
	});

	it("bar_owner ロール（barId=5）のユーザーがログイン済みで /login にアクセスした場合、/bars/5 へリダイレクトされる", async () => {
		mockVerifyToken.mockResolvedValue({
			role: "bar_owner",
			barId: 5,
		});

		const request = createMockRequest("/login", {
			"admin-token": "valid-owner-token",
		});
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/bars/5");
	});

	it("無効なトークンの場合、/login がそのまま表示される", async () => {
		mockVerifyToken.mockResolvedValue(null);

		const request = createMockRequest("/login", {
			"admin-token": "invalid-token",
		});
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("bar_owner ロールで barId が null の場合、/login がそのまま表示される", async () => {
		mockVerifyToken.mockResolvedValue({
			role: "bar_owner",
			barId: null,
		});

		const request = createMockRequest("/login", {
			"admin-token": "valid-owner-no-bar-token",
		});
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});
});

describe("middleware: セルフサーブ登録の公開パス", () => {
	it("未ログインで /bars/register にアクセスした場合、そのまま表示される（/login へ飛ばされない）", async () => {
		const request = createMockRequest("/bars/register");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("ログイン済み admin が /bars/register にアクセスした場合、/bars へリダイレクトされる", async () => {
		mockVerifyToken.mockResolvedValue({ role: "admin", barId: null });

		const request = createMockRequest("/bars/register", {
			"admin-token": "valid-admin-token",
		});
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/bars");
	});

	it("未ログインで /api/bars/register にアクセスした場合、/login へリダイレクトされない（公開API）", async () => {
		const request = createMockRequest("/api/bars/register", {}, "POST");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("未ログインで /api/bars（一般API）にアクセスした場合、/login へリダイレクトされる", async () => {
		const request = createMockRequest("/api/bars");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});
});
