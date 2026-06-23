import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockCanAccessBar = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	canAccessBar: (...args: unknown[]) => mockCanAccessBar(...args),
}));

const mockSupabaseFrom = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageGetPublicUrl = vi.fn();
const mockStorageRemove = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockSupabaseFrom(...args),
		storage: {
			from: () => ({
				upload: (...args: unknown[]) => mockStorageUpload(...args),
				getPublicUrl: (...args: unknown[]) => mockStorageGetPublicUrl(...args),
				remove: (...args: unknown[]) => mockStorageRemove(...args),
			}),
		},
	},
}));

import { POST } from "@/app/api/bars/[barId]/media/route";

// Why not: NextRequest 全体を構築せず、route が使う formData() のみを持つ最小モックを
//          NextRequest 型として渡す。File は最小限の type/size/arrayBuffer を備えた
//          スタブで代替し、ブラウザ File 実装に依存しない。
function createMockRequest(fields: {
	file?: { type: string; size: number } | null;
	type?: string | null;
}): NextRequest {
	const map = new Map<string, unknown>();
	if (fields.file !== undefined && fields.file !== null) {
		map.set("file", {
			type: fields.file.type,
			size: fields.file.size,
			arrayBuffer: () =>
				Promise.resolve(new ArrayBuffer(fields.file?.size ?? 0)),
		});
	}
	if (fields.type !== undefined && fields.type !== null) {
		map.set("type", fields.type);
	}
	return {
		formData: () =>
			Promise.resolve({
				get: (key: string) => map.get(key) ?? null,
			}),
	} as unknown as NextRequest;
}

const PUBLIC_URL =
	"https://example.supabase.co/storage/v1/object/public/bar-media/test.jpg";

describe("POST /api/bars/[barId]/media", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentUser.mockResolvedValue({
			id: "user-1",
			role: "bar_owner",
			barId: 1,
		});
		mockCanAccessBar.mockReturnValue(true);
		mockStorageUpload.mockResolvedValue({
			data: { path: "bars/1/test.jpg" },
			error: null,
		});
		mockStorageGetPublicUrl.mockReturnValue({
			data: { publicUrl: PUBLIC_URL },
		});
	});

	it("type=beer-menu の場合は bar_images へ INSERT せず url のみ返す", async () => {
		const response = await POST(
			createMockRequest({
				file: { type: "image/jpeg", size: 1000 },
				type: "beer-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ url: PUBLIC_URL });
		// メニュー画像は bar_images に触れない（枚数チェックの select も INSERT も呼ばれない）
		expect(mockSupabaseFrom).not.toHaveBeenCalled();
	});

	it("type=food-menu の場合は bar_images へ INSERT せず url のみ返す", async () => {
		const response = await POST(
			createMockRequest({
				file: { type: "image/png", size: 1000 },
				type: "food-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ url: PUBLIC_URL });
		expect(mockSupabaseFrom).not.toHaveBeenCalled();
	});

	it("type=beer-menu はスライダー5枚到達済みでも 5枚制限に弾かれずアップロードできる", async () => {
		// スライダーが既に5枚あっても、メニュー画像は制限対象外
		mockSupabaseFrom.mockImplementation(() => ({
			select: () => ({
				eq: () => ({
					eq: () =>
						Promise.resolve({
							data: [1, 2, 3, 4, 5].map((id) => ({ id, sort_order: id })),
						}),
				}),
			}),
		}));

		const response = await POST(
			createMockRequest({
				file: { type: "image/jpeg", size: 1000 },
				type: "beer-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ url: PUBLIC_URL });
		// メニュー画像は枚数チェックの select すら行わない
		expect(mockSupabaseFrom).not.toHaveBeenCalled();
	});

	it("type 無し（スライダー）の場合は従来通り bar_images へ INSERT する", async () => {
		const insertSingle = vi.fn().mockResolvedValue({
			data: { id: 10, image_url: PUBLIC_URL },
			error: null,
		});
		const insert = vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({ single: insertSingle }),
		});
		const select = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ data: [] }),
			}),
		});
		mockSupabaseFrom.mockReturnValue({ select, insert });

		const response = await POST(
			createMockRequest({ file: { type: "image/jpeg", size: 1000 } }),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(200);
		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({
				bar_id: 1,
				image_type: "slider",
				image_url: PUBLIC_URL,
			}),
		);
	});

	it("type 無し（スライダー）でスライダーが5枚あると400を返しアップロードしない", async () => {
		const select = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({
					data: [1, 2, 3, 4, 5].map((id) => ({ id, sort_order: id })),
				}),
			}),
		});
		mockSupabaseFrom.mockReturnValue({ select });

		const response = await POST(
			createMockRequest({ file: { type: "image/jpeg", size: 1000 } }),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("スライダー用メディアは最大5枚までです");
		expect(mockStorageUpload).not.toHaveBeenCalled();
	});

	it("ファイル未選択の場合は400を返す", async () => {
		const response = await POST(
			createMockRequest({ file: null, type: "beer-menu" }),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("ファイルが選択されていません");
	});

	it("未対応のファイル形式の場合は400を返す", async () => {
		const response = await POST(
			createMockRequest({
				file: { type: "image/gif", size: 1000 },
				type: "beer-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(mockStorageUpload).not.toHaveBeenCalled();
	});

	it("画像サイズ超過の場合は400を返す", async () => {
		const response = await POST(
			createMockRequest({
				file: { type: "image/jpeg", size: 6 * 1024 * 1024 },
				type: "beer-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(400);
		expect(mockStorageUpload).not.toHaveBeenCalled();
	});

	it("認証されていない場合は401を返す", async () => {
		mockGetCurrentUser.mockResolvedValue(null);

		const response = await POST(
			createMockRequest({
				file: { type: "image/jpeg", size: 1000 },
				type: "beer-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(401);
	});

	it("アクセス権限が無い場合は403を返す", async () => {
		mockCanAccessBar.mockReturnValue(false);

		const response = await POST(
			createMockRequest({
				file: { type: "image/jpeg", size: 1000 },
				type: "beer-menu",
			}),
			{ params: Promise.resolve({ barId: "1" }) },
		);

		expect(response.status).toBe(403);
	});
});
