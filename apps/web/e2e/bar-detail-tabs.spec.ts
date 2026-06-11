import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("店舗詳細ページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("店舗詳細ページにアクセスすると店舗名とお気に入りボタンが表示される", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const barName = page.locator("h1");
		await expect(barName).toBeVisible();

		const favoriteButton = page.locator(
			'button:has-text("お気に入り"), button[aria-label*="お気に入り"], [data-testid="favorite-button"]',
		);
		const hasFavoriteButton = (await favoriteButton.count()) > 0;
		expect(hasFavoriteButton).toBe(true);
	});
});
