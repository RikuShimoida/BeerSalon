import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	hashPassword: () => Promise.resolve("hashed-password"),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

vi.mock("@/lib/shizuoka-cities", () => ({
	SHIZUOKA_PREFECTURE: "静岡県",
}));

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/bars/register/route";

function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
		// biome-ignore lint/suspicious/noExplicitAny: POST が参照する json のみを持つ最小モック
	} as any;
}

/**
 * register は admin_users の重複チェック → bars insert（is_active=false）→ admin_users insert（pending）。
 * - existingUser: bar_manage_id 重複チェックの結果
 * - barInsertError / adminInsertError: それぞれの insert 失敗をシミュレート
 */
function setupSupabaseMocks(overrides?: {
	existingUser?: unknown;
	barInsertError?: unknown;
	adminInsertError?: unknown;
}) {
	const adminMaybeSingle = vi
		.fn()
		.mockResolvedValue({ data: overrides?.existingUser ?? null, error: null });
	const adminEq = vi.fn().mockReturnValue({ maybeSingle: adminMaybeSingle });
	const adminSelect = vi.fn().mockReturnValue({ eq: adminEq });
	const adminInsert = vi
		.fn()
		.mockResolvedValue({ error: overrides?.adminInsertError ?? null });

	const barSingle = vi.fn().mockResolvedValue({
		data: overrides?.barInsertError ? null : { id: 42, name: "test-bar" },
		error: overrides?.barInsertError ?? null,
	});
	const barSelect = vi.fn().mockReturnValue({ single: barSingle });
	const barInsert = vi.fn().mockReturnValue({ select: barSelect });
	const barDeleteEq = vi.fn().mockResolvedValue({ error: null });
	const barDelete = vi.fn().mockReturnValue({ eq: barDeleteEq });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bars") return { insert: barInsert, delete: barDelete };
		if (table === "admin_users")
			return { select: adminSelect, insert: adminInsert };
		throw new Error(`unexpected table: ${table}`);
	});

	return { barInsert, adminInsert, barDelete };
}

const validBody = {
	bar_manage_id: "test-bar",
	password: "password123",
	contact_email: "owner@example.com",
	contact_phone: "09012345678",
};

describe("POST /api/bars/register", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常な入力で 201 を返し、admin_users を pending・bars を is_active=false で作成する", async () => {
		const { barInsert, adminInsert } = setupSupabaseMocks();

		const response = await POST(createMockRequest(validBody));
		const json = await response.json();

		expect(response.status).toBe(201);
		expect(json.approvalStatus).toBe("pending");
		expect(json.barManageId).toBe("test-bar");

		expect(barInsert).toHaveBeenCalledWith(
			expect.objectContaining({ is_active: false }),
		);
		expect(adminInsert).toHaveBeenCalledWith(
			expect.objectContaining({
				approval_status: "pending",
				role: "bar_owner",
				bar_id: 42,
			}),
		);
	});

	it("bar_manage_id が空の場合は 400 を返す", async () => {
		setupSupabaseMocks();
		const response = await POST(
			createMockRequest({ ...validBody, bar_manage_id: "" }),
		);
		expect(response.status).toBe(400);
	});

	it("bar_manage_id がスラッグ形式でない場合は 400 を返す", async () => {
		setupSupabaseMocks();
		const response = await POST(
			createMockRequest({ ...validBody, bar_manage_id: "Fuji Beer" }),
		);
		const json = await response.json();
		expect(response.status).toBe(400);
		expect(json.error).toContain("半角英数字");
	});

	it("パスワードが8文字未満の場合は 400 を返す", async () => {
		setupSupabaseMocks();
		const response = await POST(
			createMockRequest({ ...validBody, password: "short" }),
		);
		expect(response.status).toBe(400);
	});

	it("メールアドレスが空の場合は 400 を返す", async () => {
		setupSupabaseMocks();
		const response = await POST(
			createMockRequest({ ...validBody, contact_email: "" }),
		);
		expect(response.status).toBe(400);
	});

	it("電話番号が空の場合は 400 を返す", async () => {
		setupSupabaseMocks();
		const response = await POST(
			createMockRequest({ ...validBody, contact_phone: "" }),
		);
		expect(response.status).toBe(400);
	});

	it("bar_manage_id が既存と重複する場合は 400 を返し、bars を作成しない", async () => {
		const { barInsert } = setupSupabaseMocks({
			existingUser: { id: "existing-1" },
		});

		const response = await POST(createMockRequest(validBody));
		const json = await response.json();

		expect(response.status).toBe(400);
		expect(json.error).toContain("既に使用されています");
		expect(barInsert).not.toHaveBeenCalled();
	});

	it("admin_users の作成に失敗した場合は 500 を返し、作成済みの bars を物理削除でロールバックする", async () => {
		const { barDelete } = setupSupabaseMocks({
			adminInsertError: { message: "insert failed" },
		});

		const response = await POST(createMockRequest(validBody));

		expect(response.status).toBe(500);
		// is_active=false の bars を残さず物理削除する（孤児行を作らない）
		expect(barDelete).toHaveBeenCalled();
	});

	it("並行登録で admin_users insert が UNIQUE 違反（23505）の場合は 400 に変換し、bars をロールバックする", async () => {
		const { barDelete } = setupSupabaseMocks({
			adminInsertError: { code: "23505", message: "duplicate key" },
		});

		const response = await POST(createMockRequest(validBody));
		const json = await response.json();

		expect(response.status).toBe(400);
		expect(json.error).toContain("既に使用されています");
		expect(barDelete).toHaveBeenCalled();
	});
});
