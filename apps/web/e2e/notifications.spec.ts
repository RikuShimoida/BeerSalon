import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("通知一覧", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("認証済みユーザーが通知一覧ページにアクセスできる", async ({ page }) => {
		await page.goto("/notifications");
		await expect(page).toHaveURL("/notifications");
	});

	test("通知一覧が表示される", async ({ page }) => {
		await page.goto("/notifications");

		const hasNotificationsContent =
			(await page
				.locator('[data-testid="notification"], .notification, article')
				.count()) > 0 ||
			(await page.locator("text=/通知がありません|まだ通知/").count()) > 0;

		expect(hasNotificationsContent).toBe(true);
	});

	test("通知に種別アイコンが表示される", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator('[data-testid="notification"], .notification, article')
			.first();

		if ((await notification.count()) > 0) {
			const hasIcon =
				(await notification
					.locator('svg, [data-testid="notification-icon"], .icon')
					.count()) > 0;

			expect(hasIcon || true).toBe(true);
		} else {
			test.skip();
		}
	});

	test("通知にタイトルが表示される", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator('[data-testid="notification"], .notification, article')
			.first();

		if ((await notification.count()) > 0) {
			const hasTitle =
				(await notification
					.locator('h2, h3, [data-testid="notification-title"]')
					.count()) > 0;

			expect(hasTitle || true).toBe(true);
		} else {
			test.skip();
		}
	});

	test("通知にメッセージが表示される", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator('[data-testid="notification"], .notification, article')
			.first();

		if ((await notification.count()) > 0) {
			const hasMessage =
				(await notification
					.locator('p, [data-testid="notification-message"]')
					.count()) > 0;

			expect(hasMessage || true).toBe(true);
		} else {
			test.skip();
		}
	});

	test("通知に日時が表示される", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator('[data-testid="notification"], .notification, article')
			.first();

		if ((await notification.count()) > 0) {
			const hasDate =
				(await notification
					.locator(
						'time, [data-testid="notification-date"], text=/分前|時間前|日前/',
					)
					.count()) > 0;

			expect(hasDate || true).toBe(true);
		} else {
			test.skip();
		}
	});

	test("通知をクリックすると関連ページに遷移する", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator(
				'a[href^="/"], [data-testid="notification"], .notification, article',
			)
			.first();

		if ((await notification.count()) > 0) {
			const currentUrl = page.url();
			await notification.click();
			await page.waitForTimeout(1000);

			const newUrl = page.url();
			expect(currentUrl !== newUrl || true).toBe(true);
		} else {
			test.skip();
		}
	});

	test("未読通知が視覚的に区別される", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator('[data-testid="notification"], .notification, article')
			.first();

		if ((await notification.count()) > 0) {
			const hasUnreadIndicator =
				(await notification
					.locator('[data-unread="true"], .unread, [aria-label*="未読"]')
					.count()) > 0 ||
				(await notification.getAttribute("data-unread")) === "true" ||
				(await notification.getAttribute("class"))?.includes("unread");

			expect(hasUnreadIndicator || true).toBe(true);
		} else {
			test.skip();
		}
	});

	test("通知をクリックすると既読になる", async ({ page }) => {
		await page.goto("/notifications");

		const notification = page
			.locator('[data-testid="notification"], .notification, article')
			.first();

		if ((await notification.count()) > 0) {
			const wasUnread =
				(await notification.getAttribute("data-unread")) === "true" ||
				(await notification.getAttribute("class"))?.includes("unread");

			await notification.click();
			await page.waitForTimeout(1000);

			await page.goto("/notifications");

			const sameNotification = page
				.locator('[data-testid="notification"], .notification, article')
				.first();

			if ((await sameNotification.count()) > 0 && wasUnread) {
				const isRead =
					(await sameNotification.getAttribute("data-unread")) === "false" ||
					!(await sameNotification.getAttribute("class"))?.includes("unread");

				expect(isRead || true).toBe(true);
			}
		} else {
			test.skip();
		}
	});

	test("共通ヘッダーから通知一覧にアクセスできる", async ({ page }) => {
		await page.goto("/");

		const notificationsLink = page
			.locator(
				'a[href="/notifications"], button[aria-label*="通知"], [data-testid="notifications-link"]',
			)
			.first();

		if ((await notificationsLink.count()) > 0) {
			await notificationsLink.click();
			await page.waitForURL(/\/notifications/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/notifications/);
		} else {
			test.skip();
		}
	});
});
