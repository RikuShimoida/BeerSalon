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

// Supabase clientのモック
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
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

describe("confirmAndSaveProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("有効なプロフィールデータでDB保存が成功する", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaFindUnique.mockResolvedValue(null);

			mockPrismaCreate.mockResolvedValue({
				id: "profile-id",
				userAuthId: "test-user-id",
			});

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "",
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			try {
				await confirmAndSaveProfile(undefined, formData);
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
					profileImageUrl: null,
					bio: "",
				},
			});
		});

		it("成功時にredirect('/')が呼ばれる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaFindUnique.mockResolvedValue(null);

			mockPrismaCreate.mockResolvedValue({
				id: "profile-id",
			});

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "",
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			try {
				await confirmAndSaveProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/");
		});

		it("プロフィール画像URLがある場合、そのままDB保存される", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaFindUnique.mockResolvedValue(null);

			mockPrismaCreate.mockResolvedValue({
				id: "profile-id",
			});

			const profileImageUrl =
				"https://storage.example.com/test-user-id-123456.png";

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: profileImageUrl,
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			try {
				await confirmAndSaveProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockPrismaCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						profileImageUrl: profileImageUrl,
					}),
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

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "",
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			const result = await confirmAndSaveProfile(undefined, formData);

			expect(result).toEqual({
				error: "認証が必要です",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});

		it("DB保存失敗時、詳細なエラーメッセージが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaFindUnique.mockResolvedValue(null);

			mockPrismaCreate.mockRejectedValue(new Error("Database error"));

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "",
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			const result = await confirmAndSaveProfile(undefined, formData);

			expect(result).toEqual({
				error: "プロフィールの保存に失敗しました: Database error",
			});
		});

		it("プロフィールが既に存在する場合、redirect('/')が呼ばれる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaFindUnique.mockResolvedValue({
				id: "existing-profile-id",
				userAuthId: "test-user-id",
				nickname: "既存ユーザー",
			});

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "1990-01-01",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "",
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			try {
				await confirmAndSaveProfile(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/");
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});

		it("生年月日の形式が不正な場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockPrismaFindUnique.mockResolvedValue(null);

			const profileData = {
				lastName: "山田",
				firstName: "太郎",
				nickname: "やまちゃん",
				birthday: "invalid-date",
				gender: "male",
				prefecture: "東京都",
				profileImageUrl: "",
				bio: "",
			};

			const formData = new FormData();
			formData.append("profileData", JSON.stringify(profileData));

			const result = await confirmAndSaveProfile(undefined, formData);

			expect(result).toEqual({
				error: "生年月日の形式が不正です",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});
	});
});
