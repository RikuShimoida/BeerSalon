import { expect, test } from "./helpers/fixtures";

// Issue #294: ビールメニュー新規登録でカテゴリ未選択時に ID=1 を暗黙保存するフォールバックを撤去。
// カテゴリ未選択ではエラーを出して登録させず、選択時のみ登録できることを検証する。
test.describe("Beer menu category required (Issue #294)", () => {
	test("カテゴリ未選択のまま登録するとエラーが表示され登録されない", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/100001/menus/new");

		// デフォルトでビールメニュータブが表示される
		await barOwnerPage.getByLabel("メニュー名").fill("E2Eカテゴリ未選択テスト");

		// サイズはフォームバリデーション上必須のため入力する（カテゴリ未選択のみを検証対象にする）
		await barOwnerPage.getByPlaceholder("パイント").first().fill("パイント");

		// ビールカテゴリは未選択のまま登録
		await barOwnerPage.getByRole("button", { name: "登録する" }).click();

		await expect(
			barOwnerPage.getByText("ビールカテゴリを選択してください"),
		).toBeVisible();

		// 登録成功メッセージは表示されない（=登録されていない）
		await expect(
			barOwnerPage.getByText("ビールメニューを登録しました"),
		).not.toBeVisible();
	});

	test("カテゴリを選択すると登録できる", async ({ barOwnerPage }) => {
		const menuName = `E2Eカテゴリ選択テスト_${Date.now()}`;

		await barOwnerPage.goto("/bars/100001/menus/new");

		await barOwnerPage.getByLabel("メニュー名").fill(menuName);

		// seed.e2e.sql に登録されているカテゴリを選択
		await barOwnerPage
			.getByLabel("ビールカテゴリ")
			.selectOption({ label: "IPA" });

		await barOwnerPage.getByPlaceholder("パイント").first().fill("パイント");

		await barOwnerPage.getByRole("button", { name: "登録する" }).click();

		await expect(
			barOwnerPage.getByText("ビールメニューを登録しました"),
		).toBeVisible();
	});
});
