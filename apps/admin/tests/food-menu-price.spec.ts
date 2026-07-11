import { expect, test } from "./helpers/fixtures";

// Issue #292: 食事メニュー登録に価格入力欄が無く価格を登録できない不具合の回帰テスト。
// bar_owner が食事メニュー新規登録フォームで価格を入力 → 詳細ページに価格が反映されることを検証する。
test.describe("Food menu price (Issue #292)", () => {
	test("bar_owner can register a food menu with a price and see it reflected", async ({
		barOwnerPage,
	}) => {
		const uniquePrice = 1234;
		const menuName = `E2E価格テスト_${uniquePrice}`;

		await barOwnerPage.goto("/bars/100001/menus/new");

		// 食事メニュータブへ切替（デフォルトはビールメニュー）
		await barOwnerPage.getByRole("button", { name: "食事メニュー" }).click();

		await barOwnerPage.getByLabel("メニュー名").fill(menuName);
		// Issue #292 で追加した価格入力欄
		await barOwnerPage.getByLabel("価格（円）").fill(String(uniquePrice));

		await barOwnerPage.getByRole("button", { name: "登録する" }).click();

		// 登録成功メッセージ
		await expect(
			barOwnerPage.getByText("食事メニューを登録しました"),
		).toBeVisible();

		// メニュー管理ページの食事メニューカードから詳細ページへ遷移
		await barOwnerPage.goto("/bars/100001/menus");
		await barOwnerPage
			.getByRole("link", { name: new RegExp(menuName) })
			.first()
			.click();

		// 食事メニュー詳細ページへの遷移を待機
		await barOwnerPage.waitForURL(/\/bars\/100001\/menus\/foods\/\d+$/);

		// 詳細ページで価格が表示されることを確認
		// （新規登録 POST 経路で price が欠落していた Issue #292 の回帰防止）
		await expect(
			barOwnerPage.getByRole("heading", { name: menuName }),
		).toBeVisible();
		await expect(
			barOwnerPage.getByText(`¥${uniquePrice.toLocaleString()}`),
		).toBeVisible();
	});
});
