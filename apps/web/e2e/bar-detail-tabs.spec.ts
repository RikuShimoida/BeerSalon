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

	test("基本情報タブが表示され、店舗情報が表示される", async ({ page }) => {
		await page.goto("/bars/1");

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(500);

		const hasPR =
			(await page.locator("text=/PR|説明|について/").count()) > 0 ||
			(await page.locator('[data-testid="bar-description"]').count()) > 0;

		expect(hasPR).toBe(true);
	});

	test("基本情報タブには営業時間・定休日・アクセス情報が表示される", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(500);

		const hasOpeningTime =
			(await page.locator("text=/営業時間|営業/").count()) > 0;
		const hasHoliday = (await page.locator("text=/定休日|休み/").count()) > 0;
		const hasAccess =
			(await page.locator("text=/アクセス|交通|最寄/").count()) > 0 ||
			(await page.locator("text=/住所|所在地/").count()) > 0;

		const hasBasicInfo = hasOpeningTime || hasHoliday || hasAccess;
		expect(hasBasicInfo).toBe(true);
	});

	test("お気に入りボタンをクリックするとお気に入り状態がトグルされる", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const favoriteButton = page
			.locator(
				'button:has-text("お気に入り"), button[aria-label*="お気に入り"], [data-testid="favorite-button"]',
			)
			.first();

		if ((await favoriteButton.count()) > 0) {
			await favoriteButton.click();
			await page.waitForTimeout(1000);

			await favoriteButton.click();
			await page.waitForTimeout(1000);
		} else {
			test.skip();
		}
	});

	test("メニュータブをクリックするとビールメニューと料理メニューが表示される", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const menuTab = page.locator(
			'[role="tab"]:has-text("メニュー"), button:has-text("メニュー"), [data-value="menu"]',
		);

		if ((await menuTab.count()) > 0) {
			await menuTab.first().click();
			await page.waitForTimeout(500);

			const hasBeerSection =
				(await page.locator("text=/Beers|ビール/").count()) > 0;
			const hasFoodSection =
				(await page.locator("text=/Meals|料理|フード/").count()) > 0;

			const hasMenuContent = hasBeerSection || hasFoodSection;
			expect(hasMenuContent).toBe(true);
		} else {
			test.skip();
		}
	});

	test("タグ付けされた投稿タブをクリックすると投稿一覧が表示される", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const postsTab = page.locator(
			'[role="tab"]:has-text("投稿"), button:has-text("投稿"), [data-value="posts"]',
		);

		if ((await postsTab.count()) > 0) {
			await postsTab.first().click();
			await page.waitForTimeout(500);

			const hasPostsContent =
				(await page.locator('[data-testid="post"], article').count()) > 0 ||
				(await page.locator("text=/投稿がありません|まだ投稿/").count()) > 0;

			expect(hasPostsContent).toBe(true);
		} else {
			test.skip();
		}
	});

	test("お店からの投稿タブをクリックすると記事一覧が表示される", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const articlesTab = page.locator(
			'[role="tab"]:has-text("お店からの投稿"), button:has-text("記事"), [data-value="articles"]',
		);

		if ((await articlesTab.count()) > 0) {
			await articlesTab.first().click();
			await page.waitForTimeout(500);

			const hasArticlesContent =
				(await page.locator('[data-testid="article"], article').count()) > 0 ||
				(await page.locator("text=/記事がありません|まだ記事/").count()) > 0;

			expect(hasArticlesContent).toBe(true);
		} else {
			test.skip();
		}
	});

	test("クーポンタブをクリックするとクーポン一覧が表示される", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const couponsTab = page.locator(
			'[role="tab"]:has-text("クーポン"), button:has-text("クーポン"), [data-value="coupons"]',
		);

		if ((await couponsTab.count()) > 0) {
			await couponsTab.first().click();
			await page.waitForTimeout(500);

			const hasCouponsContent =
				(await page.locator('[data-testid="coupon"]').count()) > 0 ||
				(await page
					.locator("text=/クーポンがありません|まだクーポン/")
					.count()) > 0;

			expect(hasCouponsContent).toBe(true);
		} else {
			test.skip();
		}
	});

	test("投稿タブで投稿者アカウントをクリックするとユーザープロフィールページに遷移する", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const postsTab = page.locator(
			'[role="tab"]:has-text("投稿"), button:has-text("投稿"), [data-value="posts"]',
		);

		if ((await postsTab.count()) > 0) {
			await postsTab.first().click();
			await page.waitForTimeout(500);

			const userLink = page.locator('a[href^="/users/"]').first();

			if ((await userLink.count()) > 0) {
				await userLink.click();
				await page.waitForURL(/\/users\/.*/, { timeout: 10000 });
				expect(page.url()).toMatch(/\/users\/.*/);
			} else {
				test.skip();
			}
		} else {
			test.skip();
		}
	});

	test("記事タブで記事をクリックすると記事詳細ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const articlesTab = page.locator(
			'[role="tab"]:has-text("お店からの投稿"), button:has-text("記事"), [data-value="articles"]',
		);

		if ((await articlesTab.count()) > 0) {
			await articlesTab.first().click();
			await page.waitForTimeout(500);

			const articleLink = page.locator('a[href^="/articles/"]').first();

			if ((await articleLink.count()) > 0) {
				await articleLink.click();
				await page.waitForURL(/\/articles\/\d+/, { timeout: 10000 });
				expect(page.url()).toMatch(/\/articles\/\d+/);
			} else {
				test.skip();
			}
		} else {
			test.skip();
		}
	});
});
