import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("店舗詳細ページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("店舗詳細ページにアクセスすると店舗名とお気に入りボタンが表示される", async ({
		page,
	}) => {
		// Why not: /bars/1 はローカルで開発用 seed が投入されていれば存在するが、
		// CI では seed.e2e.sql のみを投入するため id=1 のバーは存在せず 404 になる。
		// seed.e2e.sql で固定投入される /bars/100001 (E2Eテストバー静岡) を使う。
		await page.goto("/bars/100001");

		const barName = page.locator("h1");
		await expect(barName).toBeVisible();

		const favoriteButton = page.locator(
			'button:has-text("お気に入り"), button[aria-label*="お気に入り"], [data-testid="favorite-button"]',
		);
		const hasFavoriteButton = (await favoriteButton.count()) > 0;
		expect(hasFavoriteButton).toBe(true);
	});
});
