import { expect, test } from "@playwright/test";

test.describe("新規登録ページ", () => {
	test("メールアドレスとパスワードの入力欄が表示される", async ({ page }) => {
		await page.goto("/signup");

		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});
});
