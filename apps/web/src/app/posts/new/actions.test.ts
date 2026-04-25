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

describe("createPost", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("本文 + 画像1枚で投稿作成が成功する", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
				userAuthId: "test-user-id",
			});

			mockPrismaPostCreate.mockResolvedValue({
				id: BigInt(1),
				barId: BigInt(100),
				body: "テスト投稿",
			});

			mockUpload.mockResolvedValue({
				data: { path: "posts/1/image1.jpg" },
				error: null,
			});

			mockGetPublicUrl.mockReturnValue({
				data: { publicUrl: "https://storage.example.com/posts/1/image1.jpg" },
			});

			mockPrismaPostImageCreate.mockResolvedValue({
				id: BigInt(1),
				postId: BigInt(1),
				imageUrl: "https://storage.example.com/posts/1/image1.jpg",
				sortOrder: 0,
			});

			const image = new MockFile(["dummy content"], "test.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "テスト投稿");
			formData.append("image-0", image);

			try {
				await createPost(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaPostCreate).toHaveBeenCalledWith({
				data: {
					userId: "profile-id",
					barId: BigInt(100),
					body: "テスト投稿",
				},
			});
			expect(mockUpload).toHaveBeenCalledTimes(1);
			expect(mockPrismaPostImageCreate).toHaveBeenCalledTimes(1);
			expect(mockRedirect).toHaveBeenCalledWith("/bars/100");
		});

		it("本文 + 画像複数枚(最大4枚)で投稿作成が成功する", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
				userAuthId: "test-user-id",
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
				data: { publicUrl: "https://storage.example.com/posts/1/image.jpg" },
			});

			mockPrismaPostImageCreate.mockResolvedValue({
				id: BigInt(1),
			});

			const images = [
				new MockFile(["content1"], "image1.jpg", { type: "image/jpeg" }),
				new MockFile(["content2"], "image2.jpg", { type: "image/jpeg" }),
				new MockFile(["content3"], "image3.jpg", { type: "image/jpeg" }),
				new MockFile(["content4"], "image4.jpg", { type: "image/jpeg" }),
			];

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "複数画像投稿");
			for (let i = 0; i < images.length; i++) {
				formData.append(`image-${i}`, images[i]);
			}

			try {
				await createPost(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockUpload).toHaveBeenCalledTimes(4);
			expect(mockPrismaPostImageCreate).toHaveBeenCalledTimes(4);
		});

		it("本文のみ(画像なし)で投稿作成が成功する", async () => {
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

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "画像なし投稿");

			try {
				await createPost(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaPostCreate).toHaveBeenCalled();
			expect(mockUpload).not.toHaveBeenCalled();
			expect(mockPrismaPostImageCreate).not.toHaveBeenCalled();
			expect(mockRedirect).toHaveBeenCalledWith("/bars/100");
		});

		it("成功時に/bars/[barId]へリダイレクトされる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			mockPrismaPostCreate.mockResolvedValue({
				id: BigInt(1),
				barId: BigInt(999),
			});

			const formData = new FormData();
			formData.append("barId", "999");
			formData.append("body", "リダイレクト確認");

			try {
				await createPost(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/bars/999");
		});

		it("画像のsortOrderが正しく設定される", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUserProfileFindUnique.mockResolvedValue({
				id: "profile-id",
			});

			mockPrismaPostCreate.mockResolvedValue({
				id: BigInt(1),
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

			const images = [
				new MockFile(["content1"], "image1.jpg", { type: "image/jpeg" }),
				new MockFile(["content2"], "image2.jpg", { type: "image/jpeg" }),
			];

			const formData = new FormData();
			formData.append("barId", "100");
			formData.append("body", "sortOrder確認");
			formData.append("image-0", images[0]);
			formData.append("image-1", images[1]);

			try {
				await createPost(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaPostImageCreate).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					data: expect.objectContaining({ sortOrder: 0 }),
				}),
			);
			expect(mockPrismaPostImageCreate).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					data: expect.objectContaining({ sortOrder: 1 }),
				}),
			);
		});
	});

	describe("異常系", () => {
		it("未認証ユーザーの場合、エラーが返る", async () => {
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

		it("ユーザープロフィールが存在しない場合、エラーが返る", async () => {
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

		it("barId未指定の場合、バリデーションエラーが返る", async () => {
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

		it("body未指定または空の場合、バリデーションエラーが返る", async () => {
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

		it("5枚の画像を追加しても最初の4枚のみが処理される", async () => {
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
				// redirectはthrowする
			}

			// 実装上、i < 4でループしているため、最大4枚のみ処理される
			expect(mockUpload).toHaveBeenCalledTimes(4);
			expect(mockPrismaPostImageCreate).toHaveBeenCalledTimes(4);
			expect(mockRedirect).toHaveBeenCalledWith("/bars/100");
		});

		it("画像アップロード失敗時、投稿がロールバックされる", async () => {
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

		it("DB保存失敗時、エラーが返る", async () => {
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
		});
	});
});
