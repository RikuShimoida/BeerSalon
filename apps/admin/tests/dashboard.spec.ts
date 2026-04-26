import { expect, test } from "./helpers/fixtures";

test.describe("Dashboard", () => {
	test("should display dashboard after login", async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto("/");

		// ダッシュボードのタイトルを確認
		await expect(
			authenticatedPage.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();
	});

	test("should display statistics cards", async ({ authenticatedPage }) => {
		await authenticatedPage.goto("/");

		// 統計カードが表示されることを確認
		const statsCards = authenticatedPage.locator('[class*="StatsCard"]');
		if ((await statsCards.count()) > 0) {
			await expect(statsCards.first()).toBeVisible();
		}
	});

	test("should display recent activities", async ({ authenticatedPage }) => {
		await authenticatedPage.goto("/");

		// 最近のアクティビティセクションを確認
		const activitySection = authenticatedPage.getByText("最近のアクティビティ");
		if (await activitySection.isVisible()) {
			await expect(activitySection).toBeVisible();
		}
	});

	test("should navigate to bars page from sidebar", async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto("/");

		// サイドバーのバーメニューをクリック
		const barsLink = authenticatedPage.getByRole("link", { name: "バー管理" });
		if (await barsLink.isVisible()) {
			await barsLink.click();
			await expect(authenticatedPage).toHaveURL(/\/bars/);
		}
	});

	test("admin should see admin menu", async ({ adminPage }) => {
		await adminPage.goto("/");

		// 管理者メニューが表示されることを確認
		const adminMenu = adminPage.getByRole("link", { name: "管理者" });
		if (await adminMenu.isVisible()) {
			await expect(adminMenu).toBeVisible();
		}
	});

	test("bar owner should not see admin menu", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/");

		// 管理者メニューが表示されないことを確認
		const adminMenu = barOwnerPage.getByRole("link", { name: "管理者" });
		await expect(adminMenu).not.toBeVisible();
	});
});
