import { expect, test } from "@playwright/test";

// 認証をスキップするためのストレージステートを設定
test.use({
	storageState: {
		cookies: [],
		origins: [],
	},
});

test.describe("店舗詳細ページ（認証なし）", () => {
	test("受入条件4: 認証されていない場合は適切にリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("http://localhost:3000/bars/1");

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL(/\/login/);
	});
});
