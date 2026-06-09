import { beforeEach, describe, expect, it, vi } from "vitest";

// next/navigationのモック
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => {
		mockRedirect(...args);
		const error = new Error("NEXT_REDIRECT");
		error.message = "NEXT_REDIRECT";
		throw error;
	},
}));

// next/headersのモック
const mockCookieStore = {
	get: vi.fn(),
	delete: vi.fn(),
};
vi.mock("next/headers", () => ({
	cookies: vi.fn(() => mockCookieStore),
}));

// Supabase clientのモック
const mockGetUser = vi.fn();
const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockRemove = vi.fn();
const mockGetPublicUrl = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
		storage: {
			from: vi.fn(() => ({
				upload: mockUpload,
				download: mockDownload,
				remove: mockRemove,
				getPublicUrl: mockGetPublicUrl,
			})),
		},
	})),
}));

// Prismaのモック
const mockPrismaCreate = vi.fn();
const mockPrismaFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			create: vi.fn((...args: unknown[]) => mockPrismaCreate(...args)),
			findUnique: vi.fn((...args: unknown[]) => mockPrismaFindUnique(...args)),
		},
	},
}));

import { confirmAndSaveProfile } from "./actions";

const validProfileData = {
	lastName: "山田",
	firstName: "太郎",
	nickname: "やまちゃん",
	birthday: "1990-01-01",
	gender: "male",
	prefecture: "東京都",
	bio: "",
};

function setupCookies(
	profileData: Record<string, string> | null,
	imagePath: string | null = null,
) {
	mockCookieStore.get.mockImplementation((name: string) => {
		if (name === "profile_data" && profileData) {
			return { value: JSON.stringify(profileData) };
		}
		if (name === "profile_image_path" && imagePath) {
			return { value: imagePath };
		}
		return undefined;
	});
}

describe("confirmAndSaveProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("有効なプロフィールデータでDB保存が成功する", async () => {
			setupCookies(validProfileData);
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue(null);
			mockPrismaCreate.mockResolvedValue({
				id: "profile-id",
				userAuthId: "test-user-id",
			});

			try {
				await confirmAndSaveProfile(undefined, new FormData());
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaCreate).toHaveBeenCalledWith({
				data: {
					userAuthId: "test-user-id",
					lastName: "山田",
					firstName: "太郎",
					nickname: "やまちゃん",
					birthday: new Date("1990-01-01"),
					gender: "male",
					prefecture: "東京都",
					profileImageUrl: undefined,
					bio: "",
				},
			});
		});

		it("成功時にredirect('/')が呼ばれる", async () => {
			setupCookies(validProfileData);
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue(null);
			mockPrismaCreate.mockResolvedValue({ id: "profile-id" });

			try {
				await confirmAndSaveProfile(undefined, new FormData());
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/");
		});

		it("プロフィール画像がある場合、Supabase Storageへアップロードされる", async () => {
			const tempPath = "temp/test-user-id-123456.png";
			setupCookies(validProfileData, tempPath);
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue(null);

			const mockFileBlob = new Blob(["fake-image-data"], {
				type: "image/png",
			});
			mockDownload.mockResolvedValue({
				data: mockFileBlob,
				error: null,
			});
			mockUpload.mockResolvedValue({
				data: { path: "profiles/test-user-id/avatar.png" },
				error: null,
			});
			mockRemove.mockResolvedValue({ data: [], error: null });
			mockGetPublicUrl.mockReturnValue({
				data: {
					publicUrl:
						"https://storage.example.com/profiles/test-user-id/avatar.png",
				},
			});
			mockPrismaCreate.mockResolvedValue({ id: "profile-id" });

			try {
				await confirmAndSaveProfile(undefined, new FormData());
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockDownload).toHaveBeenCalledWith(tempPath);
			expect(mockUpload).toHaveBeenCalled();
			expect(mockPrismaCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						profileImageUrl:
							"https://storage.example.com/profiles/test-user-id/avatar.png",
					}),
				}),
			);
		});
	});

	describe("異常系", () => {
		it("未認証ユーザーの場合、エラーが返る", async () => {
			setupCookies(validProfileData);
			mockGetUser.mockResolvedValue({
				data: { user: null },
				error: null,
			});

			const result = await confirmAndSaveProfile(undefined, new FormData());

			expect(result).toEqual({
				error: "認証が必要です",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});

		it("DB保存失敗時、詳細なエラーメッセージが返る", async () => {
			setupCookies(validProfileData);
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue(null);
			mockPrismaCreate.mockRejectedValue(new Error("Database error"));

			const result = await confirmAndSaveProfile(undefined, new FormData());

			expect(result).toEqual({
				error: "プロフィールの保存に失敗しました: Database error",
			});
		});

		it("プロフィールが既に存在する場合、redirect('/')が呼ばれる", async () => {
			setupCookies(validProfileData);
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue({
				id: "existing-profile-id",
				userAuthId: "test-user-id",
				nickname: "既存ユーザー",
			});

			try {
				await confirmAndSaveProfile(undefined, new FormData());
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/");
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});

		it("生年月日の形式が不正な場合、エラーが返る", async () => {
			setupCookies({ ...validProfileData, birthday: "invalid-date" });
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue(null);

			const result = await confirmAndSaveProfile(undefined, new FormData());

			expect(result).toEqual({
				error: "生年月日の形式が不正です",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});

		it("画像アップロード失敗時、エラーが返る", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const tempPath = "temp/test-user-id-123456.png";
			setupCookies(validProfileData, tempPath);
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockPrismaFindUnique.mockResolvedValue(null);

			const mockFileBlob = new Blob(["fake-image-data"], {
				type: "image/png",
			});
			mockDownload.mockResolvedValue({
				data: mockFileBlob,
				error: null,
			});
			mockUpload.mockResolvedValue({
				data: null,
				error: { message: "Upload failed" },
			});

			const result = await confirmAndSaveProfile(undefined, new FormData());

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("アップロードエラー"),
				expect.anything(),
			);
			expect(result).toEqual({
				error: "画像の保存に失敗しました",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});
});
