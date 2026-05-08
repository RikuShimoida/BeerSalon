import { expect, test } from "./helpers/fixtures";

test.describe("Menu Navigation", () => {
	test("should navigate to beer menu page from sidebar menu link", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/menus");

		// bar_ownerで1件のバーがある場合、ビールメニュー管理ページにリダイレクトされる
		await barOwnerPage.waitForURL(/\/bars\/\d+\/menus\/beers/);
		await expect(
			barOwnerPage.getByRole("heading", { name: "ビールメニュー管理" }),
		).toBeVisible();
	});

	test("should display menu management button on bar list", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// メニュー管理ボタンが表示されることを確認
		const menuButton = barOwnerPage
			.getByRole("button", { name: "メニュー管理" })
			.first();
		await expect(menuButton).toBeVisible();
	});

	test("should navigate from bar list menu button to beer menu page", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// メニュー管理ボタンをクリック
		const menuButton = barOwnerPage
			.getByRole("button", { name: "メニュー管理" })
			.first();
		await menuButton.click();

		// ビールメニュー管理ページに遷移することを確認
		await barOwnerPage.waitForURL(/\/bars\/\d+\/menus\/beers/);
		await expect(
			barOwnerPage.getByRole("heading", { name: "ビールメニュー管理" }),
		).toBeVisible();
	});

	test("should display bar selection when admin accesses menu page", async ({
		adminPage,
	}) => {
		await adminPage.goto("/menus");

		// メニュー管理の見出しが表示されることを確認
		await expect(
			adminPage.getByRole("heading", { name: "メニュー管理" }),
		).toBeVisible();

		// バー選択UIが表示されることを確認
		await expect(
			adminPage.getByText("メニューを管理するバーを選択してください"),
		).toBeVisible();

		// ビールメニュー管理ボタンが表示されることを確認
		await expect(
			adminPage
				.getByRole("button", { name: "ビールメニュー管理" })
				.first(),
		).toBeVisible();
	});

	test("should navigate from menu hub to beer menu for specific bar (admin)", async ({
		adminPage,
	}) => {
		await adminPage.goto("/menus");

		// ビールメニュー管理ボタンをクリック
		await adminPage
			.getByRole("button", { name: "ビールメニュー管理" })
			.first()
			.click();

		// ビールメニュー管理ページに遷移することを確認
		await adminPage.waitForURL(/\/bars\/\d+\/menus\/beers/);
		await expect(
			adminPage.getByRole("heading", { name: "ビールメニュー管理" }),
		).toBeVisible();
	});
});
