import { beforeEach, describe, expect, it, vi } from "vitest";

// next/navigationのモック
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// next/headersのモック
const mockSet = vi.fn();
vi.mock("next/headers", () => ({
	cookies: vi.fn(() => ({
		set: mockSet,
	})),
}));

// Supabase clientのモック
const mockGetUser = vi.fn();
const mockUpload = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
		storage: {
			from: vi.fn(() => ({
				upload: mockUpload,
			})),
		},
	})),
}));

import { saveProfileToSession } from "./actions";

describe("saveProfileToSession", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("有効なプロフィールデータでセッション保存が成功し、エラーが返らない", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("bio", "");

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toBeUndefined();
		});

		it("成功時に/signup/confirmへリダイレクトされる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("bio", "");

			try {
				await saveProfileToSession(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockRedirect).toHaveBeenCalledWith("/signup/confirm");
		});

		it("データがCookieに正しく保存される", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "佐藤");
			formData.append("firstName", "花子");
			formData.append("nickname", "はなちゃん");
			formData.append("birthday", "1995-05-15");
			formData.append("gender", "female");
			formData.append("prefecture", "大阪府");
			formData.append("bio", "クラフトビール好きです");

			try {
				await saveProfileToSession(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockSet).toHaveBeenCalled();
			const setCalls = mockSet.mock.calls;
			const profileDataCall = setCalls.find(
				(call) => call[0] === "profile_data",
			);
			expect(profileDataCall).toBeDefined();

			const savedData = JSON.parse(profileDataCall[1]);
			expect(savedData).toMatchObject({
				lastName: "佐藤",
				firstName: "花子",
				nickname: "はなちゃん",
				birthday: "1995-05-15",
				gender: "female",
				prefecture: "大阪府",
				bio: "クラフトビール好きです",
			});
		});

		it("プロフィール画像をアップロードすると、画像パスがCookieに保存される", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockUpload.mockResolvedValue({
				data: { path: "temp/test-user-id/123456789.png" },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");

			formData.append("bio", "");

			const blob = new Blob(["fake image data"], { type: "image/png" });
			const file = new File([blob], "test.png", { type: "image/png" });
			formData.append("profileImage", file);

			try {
				await saveProfileToSession(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockUpload).toHaveBeenCalled();
			expect(mockSet).toHaveBeenCalled();

			const setCalls = mockSet.mock.calls;
			const imagePathCall = setCalls.find(
				(call) => call[0] === "profile_image_path",
			);
			expect(imagePathCall).toBeDefined();
			expect(imagePathCall[1]).toMatch(/^temp\/test-user-id\/\d+\.png$/);
		});
	});

	describe("異常系 - 画像バリデーションエラー", () => {
		it("ファイルサイズが5MBを超える場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");

			const largeBlob = new Blob([new ArrayBuffer(6 * 1024 * 1024)], {
				type: "image/png",
			});
			const largeFile = new File([largeBlob], "large.png", {
				type: "image/png",
			});
			formData.append("profileImage", largeFile);

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "画像ファイルは5MB以下にしてください",
			});
			expect(mockUpload).not.toHaveBeenCalled();
		});

		it("許可されていない画像形式の場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");

			const blob = new Blob(["fake image data"], { type: "image/gif" });
			const file = new File([blob], "test.gif", { type: "image/gif" });
			formData.append("profileImage", file);

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "画像形式はJPEG、PNG、WebPのみ対応しています",
			});
			expect(mockUpload).not.toHaveBeenCalled();
		});

		it("画像アップロードが失敗した場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});
			mockUpload.mockResolvedValue({
				data: null,
				error: { message: "Upload failed" },
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("bio", "");

			const blob = new Blob(["fake image data"], { type: "image/png" });
			const file = new File([blob], "test.png", { type: "image/png" });
			formData.append("profileImage", file);

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "画像のアップロードに失敗しました。もう一度お試しください。",
			});
		});
	});

	describe("異常系 - バリデーションエラー", () => {
		it("姓が空の場合、バリデーションエラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "姓を入力してください",
			});
			expect(mockRedirect).not.toHaveBeenCalled();
		});

		it("名が空の場合、バリデーションエラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "名を入力してください",
			});
		});

		it("ニックネームが空の場合、バリデーションエラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "ニックネームを入力してください",
			});
		});

		it("プロフィール文が500文字を超える場合、バリデーションエラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			const longBio = "あ".repeat(501);
			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("bio", longBio);

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "プロフィール文は500文字以内で入力してください",
			});
		});
	});

	describe("異常系 - 認証エラー", () => {
		it("未認証ユーザーの場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: null },
				error: null,
			});

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("bio", "");

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "認証が必要です",
			});
			expect(mockRedirect).not.toHaveBeenCalled();
		});
	});
});
