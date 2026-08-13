import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

const mockSendEmail = vi.fn();
vi.mock("@/lib/email", () => ({
	sendAdminPasswordResetEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

const mockResolveOrigin = vi.fn();
vi.mock("@/lib/request-origin", () => ({
	resolveRequestOrigin: (...args: unknown[]) => mockResolveOrigin(...args),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

import { POST } from "@/app/api/auth/password/forgot/route";

function createMockRequest(body: unknown): Parameters<typeof POST>[0] {
	return {
		json: () => Promise.resolve(body),
	} as Parameters<typeof POST>[0];
}

// admin_users の select と admin_password_reset_tokens の insert を、テーブル名で振り分ける。
function setupSupabase(options: {
	user: { data: unknown };
	insertError?: unknown;
}) {
	const insertMock = vi.fn().mockResolvedValue({ error: options.insertError });
	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "admin_users") {
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({ data: options.user.data }),
			};
		}
		if (table === "admin_password_reset_tokens") {
			return { insert: insertMock };
		}
		throw new Error(`unexpected table: ${table}`);
	});
	return { insertMock };
}

const NEUTRAL =
	"入力された店舗IDが登録されていれば、再設定メールを送信しました";

describe("POST /api/auth/password/forgot", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockResolveOrigin.mockReturnValue("http://localhost:3001");
	});

	it("barManageId が未指定なら 400 を返す", async () => {
		const response = await POST(createMockRequest({}));
		const body = await response.json();
		expect(response.status).toBe(400);
		expect(body.error).toBe("店舗IDを入力してください");
	});

	it("登録済み＋contact_email あり: トークンを保存しメールを送信し、中立メッセージを返す", async () => {
		const { insertMock } = setupSupabase({
			user: {
				data: {
					id: "user-1",
					contact_email: "owner@example.com",
					is_active: true,
				},
			},
		});

		const response = await POST(
			createMockRequest({ barManageId: "fuji-beer-bar" }),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe(NEUTRAL);
		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(mockSendEmail).toHaveBeenCalledTimes(1);
		const emailArg = mockSendEmail.mock.calls[0][0];
		expect(emailArg.to).toBe("owner@example.com");
		expect(emailArg.resetUrl).toMatch(
			/^http:\/\/localhost:3001\/password\/reset\?token=[0-9a-f]{64}$/,
		);
	});

	it("存在しない店舗ID: メールを送信せず、登録済みと同一の中立メッセージを返す（列挙対策）", async () => {
		const { insertMock } = setupSupabase({ user: { data: null } });

		const response = await POST(
			createMockRequest({ barManageId: "non-existent" }),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe(NEUTRAL);
		expect(insertMock).not.toHaveBeenCalled();
		expect(mockSendEmail).not.toHaveBeenCalled();
	});

	it("contact_email が未登録: メールを送信せず、同一の中立メッセージを返す", async () => {
		const { insertMock } = setupSupabase({
			user: {
				data: { id: "user-2", contact_email: null, is_active: true },
			},
		});

		const response = await POST(
			createMockRequest({ barManageId: "no-email-bar" }),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe(NEUTRAL);
		expect(insertMock).not.toHaveBeenCalled();
		expect(mockSendEmail).not.toHaveBeenCalled();
	});

	it("トークン保存に失敗してもメールを送らず中立メッセージを返す（内部失敗を露出しない）", async () => {
		setupSupabase({
			user: {
				data: {
					id: "user-3",
					contact_email: "owner@example.com",
					is_active: true,
				},
			},
			insertError: { message: "insert failed" },
		});

		const response = await POST(
			createMockRequest({ barManageId: "fuji-beer-bar" }),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe(NEUTRAL);
		expect(mockSendEmail).not.toHaveBeenCalled();
	});

	it("JSON パース失敗時は 500 を返す", async () => {
		const request = {
			json: () => Promise.reject(new Error("invalid json")),
		} as Parameters<typeof POST>[0];

		const response = await POST(request);
		expect(response.status).toBe(500);
	});
});
