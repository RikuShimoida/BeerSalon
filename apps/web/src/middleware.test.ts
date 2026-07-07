import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Why not: middleware.ts は import 時に process.env を直接見ず、createServerClient へ
//          引数で渡すだけなので、テスト側で固定値を入れておけば実行に支障はない。
//          Supabase クライアントの内部は vi.mock で完全に差し替えるため、実環境変数の
//          有無は middleware の挙動に影響しない。
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54421";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.DATABASE_URL =
	"postgresql://postgres:postgres@127.0.0.1:54422/postgres";

vi.mock("@beersalon/shared", () => ({
	logRequest: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
	createServerClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
		from: mockFrom,
	})),
}));

import { middleware } from "@/middleware";

function createMockRequest(pathname: string): NextRequest {
	const url = new URL(`http://localhost:3000${pathname}`);
	const cookieStore: { name: string; value: string }[] = [];
	return {
		nextUrl: url,
		url: url.toString(),
		cookies: {
			getAll: () => cookieStore,
			set: (name: string, value: string) => {
				cookieStore.push({ name, value });
			},
		},
	} as unknown as NextRequest;
}

describe("web middleware: 未認証時の保護ルートアクセス", () => {
	beforeEach(() => {
		mockGetUser.mockReset();
		mockFrom.mockReset();
	});

	it("未認証ユーザーが /（トップページ）にアクセスすると /login へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});

	it("未認証ユーザーが /mypage にアクセスすると /login へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/mypage");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});

	it("未認証ユーザーが /bars/1（店舗詳細）にアクセスすると /login へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/bars/1");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});

	it("未認証ユーザーが /timeline にアクセスすると /login へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/timeline");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});

	it("未認証ユーザーが /signup/profile にアクセスすると /signup へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/signup/profile");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/signup");
	});

	it("未認証ユーザーが /login にアクセスした場合はリダイレクトされない", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/login");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("未認証ユーザーが /signup にアクセスした場合はリダイレクトされない", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });

		const request = createMockRequest("/signup");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("認証済みでプロフィール登録済みユーザーが / にアクセスした場合はリダイレクトされない", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1" } },
		});
		mockFrom.mockReturnValue({
			select: () => ({
				eq: () => ({
					single: () => Promise.resolve({ data: { id: 1 } }),
				}),
			}),
		});

		const request = createMockRequest("/");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("認証済みユーザーが /login にアクセスすると / へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1" } },
		});

		const request = createMockRequest("/login");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toMatch(/\/$/);
	});

	it("認証済みユーザーが /signup にアクセスすると / へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1" } },
		});

		const request = createMockRequest("/signup");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toMatch(/\/$/);
	});

	it("認証済みだがプロフィール未作成のユーザーは /signup/profile へリダイレクトされる", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1" } },
		});
		mockFrom.mockReturnValue({
			select: () => ({
				eq: () => ({
					single: () => Promise.resolve({ data: null }),
				}),
			}),
		});

		const request = createMockRequest("/");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/signup/profile");
	});
});

describe("web middleware: 認証バックエンド到達不可時のフォールバック", () => {
	beforeEach(() => {
		mockGetUser.mockReset();
		mockFrom.mockReset();
	});

	it("getUser() が例外を投げても middleware はクラッシュせず、保護ルートは /login へリダイレクトされる", async () => {
		mockGetUser.mockRejectedValue(new Error("fetch failed"));

		const request = createMockRequest("/");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});

	it("getUser() が例外を投げても /login 自体は表示できる（リダイレクトされない）", async () => {
		mockGetUser.mockRejectedValue(new Error("fetch failed"));

		const request = createMockRequest("/login");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});

	it("認証済みでも user_profiles 照会が例外を投げた場合はクラッシュせず通常表示を優先する", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1" } },
		});
		mockFrom.mockReturnValue({
			select: () => ({
				eq: () => ({
					single: () => Promise.reject(new Error("fetch failed")),
				}),
			}),
		});

		const request = createMockRequest("/");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("location")).toBeNull();
	});
});
