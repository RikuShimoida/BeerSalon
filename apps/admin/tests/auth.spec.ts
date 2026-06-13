import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
	test("should display login page with bar manage ID and password fields", async ({
		page,
	}) => {
		await page.goto("/login");

		// ページタイトルを確認
		await expect(
			page.getByRole("heading", { name: "Beer Salon Admin" }),
		).toBeVisible();

		// 店舗ID入力欄を確認
		await expect(page.getByLabel("店舗ID")).toBeVisible();

		// パスワード入力欄を確認
		await expect(page.getByLabel("パスワード")).toBeVisible();

		// ログインボタンを確認
		await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
	});
});
