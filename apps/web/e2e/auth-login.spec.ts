import { expect, test } from "@playwright/test";

test.describe("ログインページ", () => {
	test("ログインページにアクセスできる", async ({ page }) => {
		await page.goto("/login");
		await expect(page).toHaveURL("/login");
		// Dark Taproom 化（#447）でロゴは「Beer」+「Salon」の span 分割になり、
		// 旧サブタイトル <p>ログイン</p> は撤去された。見出し・フォーム要素で検証する。
		await expect(
			page.getByRole("heading", { name: "おかえりなさい" }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "メールアドレス" }),
		).toBeVisible();
		await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
		await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
	});
});
