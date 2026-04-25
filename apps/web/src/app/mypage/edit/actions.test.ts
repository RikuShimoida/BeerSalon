import { beforeEach, describe, expect, it, vi } from "vitest";

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
		storage: {
			from: vi.fn(() => ({
				upload: mockUpload,
				getPublicUrl: mockGetPublicUrl,
			})),
		},
	})),
}));

// Prismaのモック
const mockPrismaUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			update: vi.fn((...args: unknown[]) => mockPrismaUpdate(...args)),
		},
	},
}));

import { updateProfile } from "./actions";

describe("updateProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("bioとprofileImageUrlの両方を更新できる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const base64Image =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";

			mockUpload.mockResolvedValue({
				data: { path: "test-user-id-123456.png" },
				error: null,
			});

			mockGetPublicUrl.mockReturnValue({
				data: {
					publicUrl: "https://storage.example.com/test-user-id-123456.png",
				},
			});

			mockPrismaUpdate.mockResolvedValue({
				id: "profile-id",
				bio: "新しいプロフィール文",
				profileImageUrl: "https://storage.example.com/test-user-id-123456.png",
			});

			const formData = new FormData();
			formData.append("bio", "新しいプロフィール文");
			formData.append("profileImageUrl", base64Image);

			try {
				await updateProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaUpdate).toHaveBeenCalledWith({
				where: { userAuthId: "test-user-id" },
				data: {
					bio: "新しいプロフィール文",
					profileImageUrl:
						"https://storage.example.com/test-user-id-123456.png",
				},
			});
			expect(mockRedirect).toHaveBeenCalledWith("/mypage");
		});

		it("bioのみ更新できる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUpdate.mockResolvedValue({
				id: "profile-id",
				bio: "bioだけ更新",
			});

			const formData = new FormData();
			formData.append("bio", "bioだけ更新");
			formData.append("profileImageUrl", "");

			try {
				await updateProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaUpdate).toHaveBeenCalledWith({
				where: { userAuthId: "test-user-id" },
				data: {
					bio: "bioだけ更新",
				},
			});
		});

		it("profileImageUrlのみ更新できる(base64画像アップロード)", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const base64Image =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";

			mockUpload.mockResolvedValue({
				data: { path: "test-user-id-123456.png" },
				error: null,
			});

			mockGetPublicUrl.mockReturnValue({
				data: {
					publicUrl: "https://storage.example.com/test-user-id-123456.png",
				},
			});

			mockPrismaUpdate.mockResolvedValue({
				id: "profile-id",
				profileImageUrl: "https://storage.example.com/test-user-id-123456.png",
			});

			const formData = new FormData();
			formData.append("bio", "");
			formData.append("profileImageUrl", base64Image);

			try {
				await updateProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockUpload).toHaveBeenCalled();
			expect(mockPrismaUpdate).toHaveBeenCalledWith({
				where: { userAuthId: "test-user-id" },
				data: {
					bio: null,
					profileImageUrl:
						"https://storage.example.com/test-user-id-123456.png",
				},
			});
		});

		it("成功時に/mypageへリダイレクトされる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUpdate.mockResolvedValue({
				id: "profile-id",
			});

			const formData = new FormData();
			formData.append("bio", "テスト");
			formData.append("profileImageUrl", "");

			try {
				await updateProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/mypage");
		});
	});

	describe("異常系", () => {
		it("未認証ユーザーの場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: null },
				error: null,
			});

			const formData = new FormData();
			formData.append("bio", "テスト");
			formData.append("profileImageUrl", "");

			const result = await updateProfile(undefined, formData);

			expect(result).toEqual({
				error: "認証が必要です",
			});
			expect(mockPrismaUpdate).not.toHaveBeenCalled();
		});

		it("bioが500文字を超える場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const longBio = "あ".repeat(501);
			const formData = new FormData();
			formData.append("bio", longBio);
			formData.append("profileImageUrl", "");

			const result = await updateProfile(undefined, formData);

			expect(result).toEqual({
				error: "プロフィール文は500文字以内で入力してください",
			});
			expect(mockPrismaUpdate).not.toHaveBeenCalled();
		});

		it("画像アップロード失敗時もDB更新は継続する", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const base64Image =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";

			mockUpload.mockResolvedValue({
				data: null,
				error: { message: "Upload failed" },
			});

			mockPrismaUpdate.mockResolvedValue({
				id: "profile-id",
			});

			const formData = new FormData();
			formData.append("bio", "テスト");
			formData.append("profileImageUrl", base64Image);

			try {
				await updateProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("画像アップロードエラー"),
				expect.anything(),
			);
			expect(mockPrismaUpdate).toHaveBeenCalledWith({
				where: { userAuthId: "test-user-id" },
				data: {
					bio: "テスト",
				},
			});

			consoleErrorSpy.mockRestore();
		});

		it("DB更新失敗時、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaUpdate.mockRejectedValue(new Error("Database error"));

			const formData = new FormData();
			formData.append("bio", "テスト");
			formData.append("profileImageUrl", "");

			const result = await updateProfile(undefined, formData);

			expect(result).toEqual({
				error: "プロフィールの更新に失敗しました",
			});
		});
	});
});
