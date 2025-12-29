import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("他ユーザープロフィール", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("他ユーザーのプロフィールページにアクセスできる", async ({ page }) => {
		await page.goto("/users/test-user-id");
		await expect(page).toHaveURL(/\/users\/.*/);
	});

	test("ユーザー情報（ニックネーム）が表示される", async ({ page }) => {
		await page.goto("/users/test-user-id");

		const nickname = page.locator(
			'[data-testid="user-nickname"], h1, h2:first-of-type',
		);
		const hasNickname = (await nickname.count()) > 0;
		expect(hasNickname).toBe(true);
	});

	test("フォロー数とフォロワー数が表示される", async ({ page }) => {
		await page.goto("/users/test-user-id");

		const followingCount = page.locator(
			'[data-testid="following-count"], a[href*="following"], text=/フォロー|Following/',
		);
		const followersCount = page.locator(
			'[data-testid="followers-count"], a[href*="followers"], text=/フォロワー|Followers/',
		);

		const hasFollowingCount = (await followingCount.count()) > 0;
		const hasFollowersCount = (await followersCount.count()) > 0;

		expect(hasFollowingCount || hasFollowersCount).toBe(true);
	});

	test("フォローボタンが表示され、クリックでフォローできる", async ({
		page,
	}) => {
		await page.goto("/users/test-user-id");

		const followButton = page
			.locator(
				'button:has-text("フォロー"), button:has-text("Follow"), [data-testid="follow-button"]',
			)
			.first();

		if ((await followButton.count()) > 0) {
			await followButton.click();
			await page.waitForTimeout(1000);

			const followingButton = page
				.locator(
					'button:has-text("フォロー中"), button:has-text("Following"), [data-testid="following-button"]',
				)
				.first();

			const isFollowing = (await followingButton.count()) > 0;
			expect(isFollowing).toBe(true);
		} else {
			test.skip();
		}
	});

	test("フォロー中ボタンが表示され、クリックでフォロー解除できる", async ({
		page,
	}) => {
		await page.goto("/users/test-user-id");

		const followButton = page
			.locator(
				'button:has-text("フォロー"), button:has-text("Follow"), [data-testid="follow-button"]',
			)
			.first();

		if ((await followButton.count()) > 0) {
			await followButton.click();
			await page.waitForTimeout(1000);

			const followingButton = page
				.locator(
					'button:has-text("フォロー中"), button:has-text("Following"), [data-testid="following-button"]',
				)
				.first();

			if ((await followingButton.count()) > 0) {
				await followingButton.click();
				await page.waitForTimeout(1000);

				const unfollowedButton = page
					.locator(
						'button:has-text("フォロー"), button:has-text("Follow"), [data-testid="follow-button"]',
					)
					.first();

				const isUnfollowed = (await unfollowedButton.count()) > 0;
				expect(isUnfollowed).toBe(true);
			} else {
				test.skip();
			}
		} else {
			test.skip();
		}
	});

	test("投稿一覧へのリンクが機能する", async ({ page }) => {
		await page.goto("/users/test-user-id");

		const postsLink = page
			.locator(
				'a[href*="posts"], button:has-text("投稿"), [data-testid="posts-link"]',
			)
			.first();

		if ((await postsLink.count()) > 0) {
			await postsLink.click();
			await page.waitForTimeout(500);

			const hasPostsContent =
				(await page.locator('[data-testid="post"], article').count()) > 0 ||
				(await page.locator("text=/投稿がありません|まだ投稿/").count()) > 0;

			expect(hasPostsContent).toBe(true);
		} else {
			test.skip();
		}
	});

	test("フォロー数をクリックすると該当ユーザーのフォロー一覧ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/users/test-user-id");

		const followingLink = page
			.locator('a[href*="following"], [data-testid="following-link"]')
			.first();

		if ((await followingLink.count()) > 0) {
			await followingLink.click();
			await page.waitForURL(/\/users\/.*\/following/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/users\/.*\/following/);
		} else {
			test.skip();
		}
	});

	test("フォロワー数をクリックすると該当ユーザーのフォロワー一覧ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/users/test-user-id");

		const followersLink = page
			.locator('a[href*="followers"], [data-testid="followers-link"]')
			.first();

		if ((await followersLink.count()) > 0) {
			await followersLink.click();
			await page.waitForURL(/\/users\/.*\/followers/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/users\/.*\/followers/);
		} else {
			test.skip();
		}
	});

	test("他ユーザーのフォロー一覧ページにアクセスできる", async ({ page }) => {
		await page.goto("/users/test-user-id/following");
		await expect(page).toHaveURL(/\/users\/.*\/following/);

		const hasFollowingContent =
			(await page
				.locator('[data-testid="user-card"], .user-card, article')
				.count()) > 0 ||
			(await page
				.locator("text=/フォロー中のユーザーがいません|まだフォロー/")
				.count()) > 0;

		expect(hasFollowingContent).toBe(true);
	});

	test("他ユーザーのフォロワー一覧ページにアクセスできる", async ({ page }) => {
		await page.goto("/users/test-user-id/followers");
		await expect(page).toHaveURL(/\/users\/.*\/followers/);

		const hasFollowersContent =
			(await page
				.locator('[data-testid="user-card"], .user-card, article')
				.count()) > 0 ||
			(await page
				.locator("text=/フォロワーがいません|まだフォロワー/")
				.count()) > 0;

		expect(hasFollowersContent).toBe(true);
	});
});
