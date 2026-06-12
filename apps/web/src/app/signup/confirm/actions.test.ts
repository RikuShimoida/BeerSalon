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

// Why not: user_profiles への INSERT 成功 / 既存プロフィール時の二重 INSERT 回避 / Cookie 削除 / redirect("/")
// の正常系副作用は `actions.integration.test.ts` で実 DB に対して検証済み。本 UT では Cookie / 認証 /
// 生年月日フォーマット検証 / Storage 経路のエラーハンドリング / DB 例外時の catch ブロックなど
// 「モックでないと網羅が難しいエッジケース」だけを残す。
describe("confirmAndSaveProfile (Unit: 早期 return / バリデーション / Storage エラー)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("早期 return", () => {
		it("profile_data Cookie が存在しない場合、エラーが返り DB 書き込みは発生しない", async () => {
			setupCookies(null);

			const result = await confirmAndSaveProfile(undefined, new FormData());

			expect(result).toEqual({
				error: "プロフィールデータが見つかりません",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();
		});

		it("未認証ユーザーの場合、エラーが返り DB 書き込みは発生しない", async () => {
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
	});

	describe("バリデーション", () => {
		it("生年月日の形式が不正な場合、エラーが返り DB 書き込みは発生しない", async () => {
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
	});

	describe("Storage 経路 (画像処理)", () => {
		it("画像アップロード失敗時、エラーが返り DB 書き込みは発生しない", async () => {
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

		it("画像ダウンロード失敗時、エラーが返り DB 書き込みは発生しない", async () => {
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

			mockDownload.mockResolvedValue({
				data: null,
				error: { message: "Download failed" },
			});

			const result = await confirmAndSaveProfile(undefined, new FormData());

			expect(result).toEqual({
				error: "画像の処理に失敗しました",
			});
			expect(mockPrismaCreate).not.toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});

	describe("DB 例外時のエラーハンドリング", () => {
		it("prisma.userProfile.create が throw した場合、詳細なエラーメッセージが返る", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

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

			consoleErrorSpy.mockRestore();
		});
	});
});
