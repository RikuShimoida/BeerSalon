import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("投稿作成ページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("投稿本文入力フォームが表示される", async ({ page }) => {
		await page.goto("/posts/new");

		const bodyInput = page.locator(
			'textarea[name="body"], textarea[placeholder*="本文"], [data-testid="post-body"]',
		);
		await expect(bodyInput.first()).toBeVisible();
	});
});
