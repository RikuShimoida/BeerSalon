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

		it("成功時に/signup/confirm?data={encodedData}へリダイレクトされる", async () => {
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

			expect(mockRedirect).toHaveBeenCalled();
			const callArgs = mockRedirect.mock.calls[0][0] as string;
			expect(callArgs).toMatch(/^\/signup\/confirm\?data=/);
		});

		it("エンコードされたデータが正しくURLに含まれる", async () => {
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

			const callArgs = mockRedirect.mock.calls[0][0] as string;
			const encodedData = callArgs.split("data=")[1];
			const decodedData = JSON.parse(decodeURIComponent(encodedData));

			expect(decodedData).toEqual({
				lastName: "佐藤",
				firstName: "花子",
				nickname: "はなちゃん",
				birthday: "1995-05-15",
				gender: "female",
				prefecture: "大阪府",
				profileImageUrl: undefined,
				bio: "クラフトビール好きです",
			});
		});

		it("画像をアップロードし、公開URLを取得できる", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockUpload.mockResolvedValue({
				data: { path: "test-user-id-12345.png" },
				error: null,
			});

			mockGetPublicUrl.mockReturnValue({
				data: {
					publicUrl:
						"https://example.com/storage/v1/object/public/profile-images/test-user-id-12345.png",
				},
			});

			const imageBuffer = Buffer.from("test image content");
			const mockFile = {
				size: imageBuffer.length,
				type: "image/png",
				arrayBuffer: async () => imageBuffer.buffer,
			} as unknown as File;

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("profileImage", mockFile);
			formData.append("bio", "");

			try {
				await saveProfileToSession(undefined, formData);
			} catch (_error) {
				// redirectはthrowする
			}

			expect(mockUpload).toHaveBeenCalled();
			expect(mockGetPublicUrl).toHaveBeenCalled();

			const callArgs = mockRedirect.mock.calls[0][0] as string;
			const encodedData = callArgs.split("data=")[1];
			const decodedData = JSON.parse(decodeURIComponent(encodedData));

			expect(decodedData.profileImageUrl).toBe(
				"https://example.com/storage/v1/object/public/profile-images/test-user-id-12345.png",
			);
		});

		it("画像アップロードに失敗した場合、エラーが返る", async () => {
			mockGetUser.mockResolvedValue({
				data: { user: { id: "test-user-id" } },
				error: null,
			});

			mockUpload.mockResolvedValue({
				data: null,
				error: { message: "Upload failed" },
			});

			const imageBuffer = Buffer.from("test image content");
			const mockFile = {
				size: imageBuffer.length,
				type: "image/png",
				arrayBuffer: async () => imageBuffer.buffer,
			} as unknown as File;

			const formData = new FormData();
			formData.append("lastName", "山田");
			formData.append("firstName", "太郎");
			formData.append("nickname", "やまちゃん");
			formData.append("birthday", "1990-01-01");
			formData.append("gender", "male");
			formData.append("prefecture", "東京都");
			formData.append("profileImage", mockFile);
			formData.append("bio", "");

			const result = await saveProfileToSession(undefined, formData);

			expect(result).toEqual({
				error: "画像のアップロードに失敗しました: Upload failed",
			});
			expect(mockRedirect).not.toHaveBeenCalled();
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
