import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("投稿作成ページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("店舗詳細から投稿に進むと店舗が固定表示され本文フォームが表示される", async ({
		page,
	}) => {
		// Why not: /bars/1 は開発用 seed 依存で CI では 404 になるため、
		// seed.e2e.sql で固定投入される /bars/100001 (E2Eテストバー静岡) を使う。
		await page.goto("/bars/100001");

		// 「このお店に投稿する」導線から投稿ページへ遷移する
		await page.getByRole("link", { name: "このお店に投稿する" }).click();
		await expect(page).toHaveURL(/\/posts\/new\?barId=100001/);

		// 投稿対象店舗が固定表示され、選び直すプルダウン(select)は存在しない
		await expect(page.getByText("投稿する店舗")).toBeVisible();
		await expect(page.locator("select")).toHaveCount(0);

		// 投稿対象の barId が hidden で送信される
		const hiddenBarId = page.locator('input[type="hidden"][name="barId"]');
		await expect(hiddenBarId).toHaveValue("100001");

		// 本文フォームが表示される
		const bodyInput = page.locator('textarea[name="body"]');
		await expect(bodyInput).toBeVisible();
	});

	test("barId無しで直接アクセスすると店舗詳細からの投稿を促す案内が表示される", async ({
		page,
	}) => {
		await page.goto("/posts/new");

		// 店舗が確定していないため本文フォームは出さず、案内を表示する
		await expect(
			page.getByText("このお店に投稿する", { exact: false }),
		).toBeVisible();
		await expect(page.locator('textarea[name="body"]')).toHaveCount(0);
	});
});
