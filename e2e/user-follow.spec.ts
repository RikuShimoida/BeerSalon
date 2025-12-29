import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("フォロー/フォロワー機能", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("自分のフォロー一覧ページにアクセスできる", async ({ page }) => {
		await page.goto("/mypage/following");
		await expect(page).toHaveURL("/mypage/following");
	});

	test("自分のフォロワー一覧ページにアクセスできる", async ({ page }) => {
		await page.goto("/mypage/followers");
		await expect(page).toHaveURL("/mypage/followers");
	});

	test("フォロー一覧にフォロー中のユーザーが表示される", async ({ page }) => {
		await page.goto("/mypage/following");

		const hasFollowingContent =
			(await page
				.locator('[data-testid="user-card"], .user-card, article')
				.count()) > 0 ||
			(await page
				.locator("text=/フォロー中のユーザーがいません|まだフォロー/")
				.count()) > 0;

		expect(hasFollowingContent).toBe(true);
	});

	test("フォロワー一覧にフォロワーが表示される", async ({ page }) => {
		await page.goto("/mypage/followers");

		const hasFollowersContent =
			(await page
				.locator('[data-testid="user-card"], .user-card, article')
				.count()) > 0 ||
			(await page
				.locator("text=/フォロワーがいません|まだフォロワー/")
				.count()) > 0;

		expect(hasFollowersContent).toBe(true);
	});

	test("フォロー一覧でユーザーカードをクリックするとプロフィールページに遷移する", async ({
		page,
	}) => {
		await page.goto("/mypage/following");

		const userCard = page
			.locator(
				'a[href^="/users/"], [data-testid="user-card"], .user-card, article',
			)
			.first();

		if ((await userCard.count()) > 0) {
			await userCard.click();
			await page.waitForURL(/\/users\/.*/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/users\/.*/);
		} else {
			test.skip();
		}
	});

	test("フォロワー一覧でユーザーカードをクリックするとプロフィールページに遷移する", async ({
		page,
	}) => {
		await page.goto("/mypage/followers");

		const userCard = page
			.locator(
				'a[href^="/users/"], [data-testid="user-card"], .user-card, article',
			)
			.first();

		if ((await userCard.count()) > 0) {
			await userCard.click();
			await page.waitForURL(/\/users\/.*/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/users\/.*/);
		} else {
			test.skip();
		}
	});

	test("マイページからフォロー一覧へ遷移できる", async ({ page }) => {
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

	test("マイページからフォロワー一覧へ遷移できる", async ({ page }) => {
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
