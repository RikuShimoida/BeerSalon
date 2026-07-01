import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockCanAccessBar = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	canAccessBar: (...args: unknown[]) => mockCanAccessBar(...args),
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
	},
}));

// URL バリデータは本テストの対象外なので常に valid を返すモックにし、
// 支払い方法同期ロジックの検証に集中する
vi.mock("@/lib/validators", () => ({
	validateWebsiteUrl: () => ({ isValid: true }),
	validateInstagramUrl: () => ({ isValid: true }),
	validateXUrl: () => ({ isValid: true }),
	validateFacebookUrl: () => ({ isValid: true }),
	validateLineUrl: () => ({ isValid: true }),
	validateCoordinates: () => ({
		isValid: true,
		latitude: null,
		longitude: null,
	}),
}));

import type { NextRequest } from "next/server";
import { PUT } from "@/app/api/bars/[barId]/route";

function createMockRequest(body: unknown): NextRequest {
	return {
		json: () => Promise.resolve(body),
		// biome-ignore lint/suspicious/noExplicitAny: PUT が参照する json のみを持つ最小モック
	} as any;
}

/**
 * bars PUT は複数テーブルへ順番に .from() を呼ぶ。
 * テーブル名ごとにモックチェーンを差し替え、支払い方法の delete / insert 呼び出しを観測する。
 */
function setupSupabaseMocks(overrides?: { paymentInsertError?: unknown }) {
	const barSingle = vi
		.fn()
		.mockResolvedValue({ data: { id: 1, name: "テストバー" }, error: null });
	const barSelect = vi.fn().mockReturnValue({ single: barSingle });
	const barEq = vi.fn().mockReturnValue({ select: barSelect });
	const barUpdate = vi.fn().mockReturnValue({ eq: barEq });

	const paymentDeleteEq = vi.fn().mockResolvedValue({ error: null });
	const paymentDelete = vi.fn().mockReturnValue({ eq: paymentDeleteEq });
	const paymentInsert = vi
		.fn()
		.mockResolvedValue({ error: overrides?.paymentInsertError ?? null });

	const openingDeleteEq = vi.fn().mockResolvedValue({ error: null });
	const openingDelete = vi.fn().mockReturnValue({ eq: openingDeleteEq });
	const openingInsert = vi.fn().mockResolvedValue({ error: null });

	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "bars") return { update: barUpdate };
		if (table === "bar_payment_methods")
			return { delete: paymentDelete, insert: paymentInsert };
		if (table === "bar_opening_hours")
			return { delete: openingDelete, insert: openingInsert };
		throw new Error(`unexpected table: ${table}`);
	});

	return {
		paymentDelete,
		paymentDeleteEq,
		paymentInsert,
	};
}

describe("PUT /api/bars/[barId] 支払い方法同期", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
	});

	it("選択した支払い方法を bar_id で全削除してから再登録する", async () => {
		const { paymentDelete, paymentDeleteEq, paymentInsert } =
			setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [1, 3],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		// 既存分を bar_id で全削除
		expect(paymentDelete).toHaveBeenCalledTimes(1);
		expect(paymentDeleteEq).toHaveBeenCalledWith("bar_id", "5");
		// 選択分を再 INSERT（重複なし・UNIQUE制約 bar_id+payment_method_id を守る形）
		expect(paymentInsert).toHaveBeenCalledWith([
			{ bar_id: 5, payment_method_id: 1 },
			{ bar_id: 5, payment_method_id: 3 },
		]);
	});

	it("空配列を渡すと全削除のみ行い INSERT しない", async () => {
		const { paymentDelete, paymentDeleteEq, paymentInsert } =
			setupSupabaseMocks();

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(200);
		expect(paymentDelete).toHaveBeenCalledTimes(1);
		expect(paymentDeleteEq).toHaveBeenCalledWith("bar_id", "5");
		expect(paymentInsert).not.toHaveBeenCalled();
	});

	it("payment_method_ids を送らない場合は削除も INSERT も行わない", async () => {
		const { paymentDelete, paymentInsert } = setupSupabaseMocks();

		const response = await PUT(createMockRequest({ name: "テストバー" }), {
			params: Promise.resolve({ barId: "5" }),
		});

		expect(response.status).toBe(200);
		expect(paymentDelete).not.toHaveBeenCalled();
		expect(paymentInsert).not.toHaveBeenCalled();
	});

	it("INSERT が失敗した場合は500を返す", async () => {
		setupSupabaseMocks({ paymentInsertError: { message: "insert failed" } });

		const response = await PUT(
			createMockRequest({
				name: "テストバー",
				payment_method_ids: [2],
			}),
			{ params: Promise.resolve({ barId: "5" }) },
		);

		expect(response.status).toBe(500);
	});
});
