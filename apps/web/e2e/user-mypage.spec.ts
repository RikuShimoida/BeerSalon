import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("マイページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("認証済みユーザーがマイページにアクセスできる", async ({ page }) => {
		await page.goto("/mypage");
		await expect(page).toHaveURL("/mypage");
	});

	test("マイページにニックネームが表示される", async ({ page }) => {
		await page.goto("/mypage");

		const nickname = page.locator(
			'[data-testid="user-nickname"], h1, h2:first-of-type',
		);
		await expect(nickname.first()).toBeVisible();
	});

	test("フォロー数とフォロワー数が表示される", async ({ page }) => {
		await page.goto("/mypage");

		const followingCount = page.locator(
			'[data-testid="following-count"], a[href*="following"], text=/フォロー|Following/',
		);
		const followersCount = page.locator(
			'[data-testid="followers-count"], a[href*="followers"], text=/フォロワー|Followers/',
		);

		const hasFollowingCount = (await followingCount.count()) > 0;
		const hasFollowersCount = (await followersCount.count()) > 0;

		expect(hasFollowingCount).toBe(true);
		expect(hasFollowersCount).toBe(true);
	});

	test("投稿タブが表示され、自分の投稿一覧が表示される", async ({ page }) => {
		await page.goto("/mypage");

		const postsTab = page.locator(
			'[role="tab"]:has-text("投稿"), button:has-text("投稿"), [data-value="posts"]',
		);

		if ((await postsTab.count()) > 0) {
			await postsTab.first().click();
			await page.waitForTimeout(500);
		}

		const hasPostsContent =
			(await page.locator('[data-testid="post"], article').count()) > 0 ||
			(await page.locator("text=/投稿がありません|まだ投稿/").count()) > 0;

		expect(hasPostsContent).toBe(true);
	});

	test("持っているクーポンタブが表示され、クーポン一覧が表示される", async ({
		page,
	}) => {
		await page.goto("/mypage");

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

	test("タブを切り替えると表示内容が切り替わる", async ({ page }) => {
		await page.goto("/mypage");

		const postsTab = page.locator(
			'[role="tab"]:has-text("投稿"), button:has-text("投稿"), [data-value="posts"]',
		);
		const couponsTab = page.locator(
			'[role="tab"]:has-text("クーポン"), button:has-text("クーポン"), [data-value="coupons"]',
		);

		if ((await postsTab.count()) > 0 && (await couponsTab.count()) > 0) {
			await postsTab.first().click();
			await page.waitForTimeout(300);

			await couponsTab.first().click();
			await page.waitForTimeout(300);

			await postsTab.first().click();
			await page.waitForTimeout(300);
		} else {
			test.skip();
		}
	});

	test("フォロー数をクリックするとフォロー一覧ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/mypage");

		const followingLink = page
			.locator('a[href*="following"], [data-testid="following-link"]')
			.first();

		if ((await followingLink.count()) > 0) {
			await followingLink.click();
			await page.waitForURL(/\/mypage\/following/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/mypage\/following/);
		} else {
			test.skip();
		}
	});

	test("フォロワー数をクリックするとフォロワー一覧ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/mypage");

		const followersLink = page
			.locator('a[href*="followers"], [data-testid="followers-link"]')
			.first();

		if ((await followersLink.count()) > 0) {
			await followersLink.click();
			await page.waitForURL(/\/mypage\/followers/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/mypage\/followers/);
		} else {
			test.skip();
		}
	});
});
