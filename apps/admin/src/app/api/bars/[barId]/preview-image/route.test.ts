import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

const mockGetCurrentUser = vi.fn();
const mockCanAccessBar = vi.fn();
vi.mock("@/lib/auth", () => ({
	getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
	canAccessBar: (...args: unknown[]) => mockCanAccessBar(...args),
}));

const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
	supabaseAdmin: {
		from: (...args: unknown[]) => mockFrom(...args),
		storage: {
			from: (...args: unknown[]) => mockStorageFrom(...args),
		},
	},
}));

import { POST } from "@/app/api/bars/[barId]/preview-image/route";

type FileLike = {
	size: number;
	type: string;
	arrayBuffer: () => Promise<ArrayBuffer>;
};

function validFile(overrides: Partial<FileLike> = {}): FileLike {
	return {
		size: 104 * 1024,
		type: "image/png",
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		...overrides,
	};
}

function createRequest(file: FileLike | null): Parameters<typeof POST>[0] {
	return {
		formData: () =>
			Promise.resolve({
				get: (key: string) => (key === "file" ? file : null),
			}),
	} as unknown as Parameters<typeof POST>[0];
}

function createParams(barId = "1"): Parameters<typeof POST>[1] {
	return { params: Promise.resolve({ barId }) };
}

const adminUser = {
	id: "user-1",
	barManageId: "admin",
	name: "管理者",
	role: "admin" as const,
	barId: null,
};

// bars テーブルの select/update と storage 操作を設定する
function setupSupabase(options: {
	existingPreviewUrl?: string | null;
	uploadResult?: {
		data: { path: string } | null;
		error: { message: string } | null;
	};
	updateError?: { message: string } | null;
}) {
	const {
		existingPreviewUrl = null,
		uploadResult = { data: { path: "bars/1/preview_123.png" }, error: null },
		updateError = null,
	} = options;

	const readChain = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi
			.fn()
			.mockResolvedValue({ data: { preview_image_url: existingPreviewUrl } }),
	};
	const updateEq = vi.fn().mockResolvedValue({ error: updateError });
	const updateChain = {
		update: vi.fn().mockReturnValue({ eq: updateEq }),
	};
	mockFrom.mockReturnValueOnce(readChain).mockReturnValueOnce(updateChain);

	const storageChain = {
		remove: vi.fn().mockResolvedValue({ error: null }),
		upload: vi.fn().mockResolvedValue(uploadResult),
		getPublicUrl: vi.fn().mockReturnValue({
			data: {
				publicUrl:
					"https://example.supabase.co/storage/v1/object/public/bar-preview-images/bars/1/preview_123.png",
			},
		}),
	};
	mockStorageFrom.mockReturnValue(storageChain);

	return { readChain, updateChain, updateEq, storageChain };
}

describe("POST /api/bars/:barId/preview-image", () => {
	beforeEach(() => {
		// Why not: clearAllMocks は mockReturnValueOnce のキューを消さず、前テストの残りが漏れるため reset を使う
		vi.resetAllMocks();
		mockGetCurrentUser.mockResolvedValue(adminUser);
		mockCanAccessBar.mockReturnValue(true);
	});

	it("未認証の場合 401 を返す", async () => {
		mockGetCurrentUser.mockResolvedValue(null);

		const response = await POST(createRequest(validFile()), createParams());
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("認証されていません");
	});

	it("アクセス権限がない場合 403 を返す", async () => {
		mockCanAccessBar.mockReturnValue(false);

		const response = await POST(createRequest(validFile()), createParams());
		const body = await response.json();

		expect(response.status).toBe(403);
		expect(body.error).toBe("アクセス権限がありません");
	});

	it("ファイル未選択の場合 400 を返す", async () => {
		const response = await POST(createRequest(null), createParams());
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("画像ファイルが選択されていません");
	});

	it("5MB を超える場合 400 を返す", async () => {
		const response = await POST(
			createRequest(validFile({ size: 5 * 1024 * 1024 + 1 })),
			createParams(),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("画像サイズは5MB以下にしてください");
	});

	it("対応外のMIMEタイプの場合 400 を返す", async () => {
		const response = await POST(
			createRequest(validFile({ type: "image/gif" })),
			createParams(),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("画像形式はJPEG、PNG、WebPのみ対応しています");
	});

	it("Storage アップロード失敗時、500 と実エラー detail を返す", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		setupSupabase({
			uploadResult: {
				data: null,
				error: { message: "new row violates row-level security policy" },
			},
		});

		const response = await POST(createRequest(validFile()), createParams());
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("画像のアップロードに失敗しました");
		expect(body.detail).toBe("new row violates row-level security policy");
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("DB更新失敗時、500 と実エラー detail を返す", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		setupSupabase({ updateError: { message: "column does not exist" } });

		const response = await POST(createRequest(validFile()), createParams());
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toBe("データベースの更新に失敗しました");
		expect(body.detail).toBe("column does not exist");
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("正常時、公開URLを返し bars.preview_image_url を更新する", async () => {
		const { updateChain, updateEq } = setupSupabase({});

		const response = await POST(createRequest(validFile()), createParams());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.preview_image_url).toBe(
			"https://example.supabase.co/storage/v1/object/public/bar-preview-images/bars/1/preview_123.png",
		);
		expect(updateChain.update).toHaveBeenCalledWith({
			preview_image_url:
				"https://example.supabase.co/storage/v1/object/public/bar-preview-images/bars/1/preview_123.png",
		});
		expect(updateEq).toHaveBeenCalledWith("id", "1");
	});
});
