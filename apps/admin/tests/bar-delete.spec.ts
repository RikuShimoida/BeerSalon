import { expect, test } from "./helpers/fixtures";

// seed.e2e.sql の固定バー
const BAR_ID = 100001;
const BAR_NAME = "E2Eテストバー静岡";

test.describe("Bar Delete (admin only)", () => {
	// Why not: 実削除は seed の固定バーを消してしまい後続 E2E を壊すため行わない。
	// 表示制御とモーダルのガードまでを E2E で担保し、実削除の結果は UT で担保する。
	test("admin は削除ボタンを表示し、モーダルは店舗名一致まで削除実行を非活性にする", async ({
		adminPage,
	}) => {
		await adminPage.goto(`/bars/${BAR_ID}`);

		const deleteButton = adminPage.getByRole("button", { name: "店舗を削除" });
		await expect(deleteButton).toBeVisible();

		await deleteButton.click();

		const confirmButton = adminPage.getByRole("button", { name: "削除する" });
		await expect(confirmButton).toBeDisabled();

		const nameInput = adminPage.getByLabel(
			`削除するには店舗名「${BAR_NAME}」を入力してください`,
		);

		// 不一致では非活性のまま
		await nameInput.fill("まちがった名前");
		await expect(confirmButton).toBeDisabled();

		// 店舗名一致で活性化
		await nameInput.fill(BAR_NAME);
		await expect(confirmButton).toBeEnabled();

		// キャンセルでモーダルを閉じる（実削除はしない）
		await adminPage.getByRole("button", { name: "キャンセル" }).click();
		await expect(confirmButton).toBeHidden();
	});

	test("bar_owner には削除ボタンが表示されない", async ({ barOwnerPage }) => {
		await barOwnerPage.goto(`/bars/${BAR_ID}`);

		// 店舗詳細が描画されるのを待つ
		await expect(
			barOwnerPage.getByRole("heading", { name: BAR_NAME, level: 1 }),
		).toBeVisible();

		await expect(
			barOwnerPage.getByRole("button", { name: "店舗を削除" }),
		).toHaveCount(0);
	});
});
