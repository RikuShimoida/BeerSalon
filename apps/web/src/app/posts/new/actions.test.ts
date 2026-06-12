import { beforeEach, describe, expect, it, vi } from "vitest";

// FileクラスのarrayBufferメソッドをモック
class MockFile extends File {
	async arrayBuffer(): Promise<ArrayBuffer> {
		const encoder = new TextEncoder();
		const data = encoder.encode("dummy file content");
		return data.buffer;
	}
}

// next/navigationのモック
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// Supabase clientのモック
const mockGetUser = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
	})),
	createAdminClient: vi.fn(() => ({
		storage: {
			from: vi.fn(() => ({
				upload: mockUpload,
				getPublicUrl: mockGetPublicUrl,
			})),
		},
	})),
}));

// Prismaのモック
const mockPrismaUserProfileFindUnique = vi.fn();
const mockPrismaPostCreate = vi.fn();
const mockPrismaPostImageCreate = vi.fn();
const mockPrismaPostImageDeleteMany = vi.fn();
const mockPrismaPostDelete = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: vi.fn((...args: unknown[]) =>
				mockPrismaUserProfileFindUnique(...args),
			),
		},
		post: {
			create: vi.fn((...args: unknown[]) => mockPrismaPostCreate(...args)),
			delete: vi.fn((...args: unknown[]) => mockPrismaPostDelete(...args)),
		},
		postImage: {
			create: vi.fn((...args: unknown[]) => mockPrismaPostImageCreate(...args)),
			deleteMany: vi.fn((...args: unknown[]) =>
				mockPrismaPostImageDeleteMany(...args),
			),
		},
	},
}));

import { createPost } from "./actions";

// Why not: 投稿の DB 副作用 (posts / post_images の INSERT、sortOrder の順序、リダイレクト URL) は
// `actions.integration.test.ts` で実 DB に対して検証済み。本 UT では Server Action の早期 return
// (認証チェック / プロフィール存在チェック / Zod バリデーション) と、画像 5 枚制限・ロールバックなど
// 「モックでないと網羅が難しい分岐」だけを残す。
describe("createPost (Unit: 早期 return / バリデーション / ロールバック)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("早期 return", () => {
		it("未認証ユーザーの場合、エラーが返り DB 書き込みは発生しない", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: null },
				error: null,
			});

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "テスト");

			const result = await createPost(undefined, formData);

			expect(result).toEqual({
				error: "認証が必要です",
			});
			expect(mockPrismaPostCreate).not.toHaveBeenCalled();
		});

		it("ユーザープロフィールが存在しない場合、エラーが返り DB 書き込みは発生しない", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue(null);

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "テスト");

			const result = await createPost(undefined, formData);

			expect(result).toEqual({
				error: "ユーザープロフィールが見つかりません",
			});
			expect(mockPrismaPostCreate).not.toHaveBeenCalled();
		});
	});

	describe("Zod バリデーション", () => {
		it("barId 未指定の場合、バリデーションエラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			const formData = new FormData();
			formData.append("body", "店舗未選択");

			const result = await createPost(undefined, formData);

			expect(result?.error).toBeTruthy();
			expect(mockPrismaPostCreate).not.toHaveBeenCalled();
		});

		it("body が空の場合、バリデーションエラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "");

			const result = await createPost(undefined, formData);

			expect(result?.error).toBeTruthy();
			expect(mockPrismaPostCreate).not.toHaveBeenCalled();
		});
	});

	describe("画像枚数制限", () => {
		it("5 枚の画像を渡しても先頭 4 枚のみがアップロードされる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			mockPrismaPostCreate.mockResolvedValue({
				id: BigInt(1),
				barId: BigInt(100),
			});

			mockUpload.mockResolvedValue({
				data: { path: "posts/1/image.jpg" },
				error: null,
			});

			mockGetPublicUrl.mockReturnValue({
				data: { publicUrl: "https://storage.example.com/image.jpg" },
			});

			mockPrismaPostImageCreate.mockResolvedValue({
				id: BigInt(1),
			});

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "画像5枚");
			for (let i = 0; i < 5; i++) {
				formData.append(
					`image-${i}`,
					new MockFile([`content${i}`], `image${i}.jpg`, {
						type: "image/jpeg",
					}),
				);
			}

			try {
				await createPost(undefined, formData);
			} catch (_error) {
				// redirect は throw する
			}

			// 実装上、actions.ts 内で `for (let i = 0; i < 4; i++)` でループしているため、最大 4 枚のみ処理される
			expect(mockUpload).toHaveBeenCalledTimes(4);
			expect(mockPrismaPostImageCreate).toHaveBeenCalledTimes(4);
			expect(mockRedirect).toHaveBeenCalledWith("/bars/100");
		});
	});

	describe("ロールバック / エラーハンドリング", () => {
		it("画像アップロード失敗時、posts と post_images の削除がリクエストされる", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			mockPrismaPostCreate.mockResolvedValue({
				id: BigInt(1),
				barId: BigInt(100),
			});

			mockUpload.mockResolvedValue({
				data: null,
				error: { message: "Upload failed" },
			});

			mockPrismaPostImageDeleteMany.mockResolvedValue({ count: 0 });
			mockPrismaPostDelete.mockResolvedValue({});

			const image = new MockFile(["dummy"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "画像アップロード失敗テスト");
			formData.append("image-0", image);

			const result = await createPost(undefined, formData);

			expect(result).toEqual({
				error: "投稿の作成に失敗しました",
				barId: "100",
			});
			expect(mockPrismaPostImageDeleteMany).toHaveBeenCalledWith({
				where: { postId: BigInt(1) },
			});
			expect(mockPrismaPostDelete).toHaveBeenCalledWith({
				where: { id: BigInt(1) },
			});
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("投稿ID 1 をロールバックしました"),
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		it("post.create が throw した場合、汎用エラーメッセージで barId 付きで返る", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			mockPrismaPostCreate.mockRejectedValue(new Error("Database error"));

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "DB失敗テスト");

			const result = await createPost(undefined, formData);

			expect(result).toEqual({
				error: "投稿の作成に失敗しました",
				barId: "100",
			});

			consoleErrorSpy.mockRestore();
		});
	});
});
