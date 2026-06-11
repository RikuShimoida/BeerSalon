import { expect, test } from "@playwright/test";

test.describe("ログインページ", () => {
	test("ログインページにアクセスできる", async ({ page }) => {
		await page.goto("/login");
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1")).toContainText("Beer Salon");
		await expect(page.locator("p")).toContainText("ログイン");
	});
});
