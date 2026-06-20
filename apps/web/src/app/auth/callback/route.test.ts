import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			exchangeCodeForSession: mockExchangeCodeForSession,
			verifyOtp: mockVerifyOtp,
		},
	})),
}));

import { GET } from "./route";

const buildRequest = (path: string): NextRequest =>
	new NextRequest(new URL(`http://localhost:3000${path}`));

const locationOf = (response: Response): string =>
	new URL(response.headers.get("location") as string).pathname +
	new URL(response.headers.get("location") as string).search;

describe("GET /auth/callback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("PKCE フロー（code パラメータ）", () => {
		it("code 交換が成功すると next（既定 /signup/profile）へリダイレクトする", async () => {
			mockExchangeCodeForSession.mockResolvedValue({ error: null });

			const response = await GET(
				buildRequest("/auth/callback?code=valid-code"),
			);

			expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
			expect(response.status).toBe(307);
			expect(locationOf(response)).toBe("/signup/profile");
		});

		it("code 交換が成功し next 指定があればそこへリダイレクトする", async () => {
			mockExchangeCodeForSession.mockResolvedValue({ error: null });

			const response = await GET(
				buildRequest("/auth/callback?code=valid-code&next=/password/reset"),
			);

			expect(locationOf(response)).toBe("/password/reset");
		});

		it("code 交換が失敗すると /signup?error=invalid_token へリダイレクトする", async () => {
			mockExchangeCodeForSession.mockResolvedValue({
				error: { message: "invalid code" },
			});

			const response = await GET(buildRequest("/auth/callback?code=bad-code"));

			expect(locationOf(response)).toBe("/signup?error=invalid_token");
		});

		it("recovery タイプで code 交換が失敗すると /password/forgot?error=invalid_token へリダイレクトする", async () => {
			mockExchangeCodeForSession.mockResolvedValue({
				error: { message: "expired" },
			});

			const response = await GET(
				buildRequest(
					"/auth/callback?code=bad-code&type=recovery&next=/password/reset",
				),
			);

			expect(locationOf(response)).toBe("/password/forgot?error=invalid_token");
		});

		it("code が存在する場合は verifyOtp は呼ばれない", async () => {
			mockExchangeCodeForSession.mockResolvedValue({ error: null });

			await GET(buildRequest("/auth/callback?code=valid-code"));

			expect(mockVerifyOtp).not.toHaveBeenCalled();
		});
	});

	describe("OTP フロー（token_hash + type）の既存挙動が壊れていないこと", () => {
		it("recovery の token_hash 検証が成功すると next（/password/reset）へリダイレクトする", async () => {
			mockVerifyOtp.mockResolvedValue({ error: null });

			const response = await GET(
				buildRequest(
					"/auth/callback?token_hash=hash&type=recovery&next=/password/reset",
				),
			);

			expect(mockVerifyOtp).toHaveBeenCalledWith({
				type: "recovery",
				token_hash: "hash",
			});
			expect(locationOf(response)).toBe("/password/reset");
		});

		it("signup の token_hash 検証が成功すると /signup/profile へリダイレクトする", async () => {
			mockVerifyOtp.mockResolvedValue({ error: null });

			const response = await GET(
				buildRequest("/auth/callback?token_hash=hash&type=signup"),
			);

			expect(mockVerifyOtp).toHaveBeenCalledWith({
				type: "signup",
				token_hash: "hash",
			});
			expect(locationOf(response)).toBe("/signup/profile");
		});

		it("recovery の token_hash 検証が失敗すると /password/forgot?error=invalid_token へリダイレクトする", async () => {
			mockVerifyOtp.mockResolvedValue({ error: { message: "invalid" } });

			const response = await GET(
				buildRequest("/auth/callback?token_hash=hash&type=recovery"),
			);

			expect(locationOf(response)).toBe("/password/forgot?error=invalid_token");
		});

		it("signup の token_hash 検証が失敗すると /signup?error=invalid_token へリダイレクトする", async () => {
			mockVerifyOtp.mockResolvedValue({ error: { message: "bad token" } });

			const response = await GET(
				buildRequest("/auth/callback?token_hash=hash&type=signup"),
			);

			expect(locationOf(response)).toBe("/signup?error=invalid_token");
		});
	});

	describe("パラメータが無い場合", () => {
		it("code も token_hash も無ければ既定の /signup/profile へリダイレクトする", async () => {
			const response = await GET(buildRequest("/auth/callback"));

			expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
			expect(mockVerifyOtp).not.toHaveBeenCalled();
			expect(locationOf(response)).toBe("/signup/profile");
		});
	});
});
