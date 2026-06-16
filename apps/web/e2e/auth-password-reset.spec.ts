import { expect, test } from "@playwright/test";

test.describe("パスワード再設定フロー", () => {
	test("ログインページの「パスワードをお忘れの方」リンクから/password/forgotへ遷移する", async ({
		page,
	}) => {
		await page.goto("/login");

		const link = page.getByRole("link", { name: "パスワードをお忘れの方" });
		await expect(link).toHaveAttribute("href", "/password/forgot");

		await link.click();
		await expect(page).toHaveURL("/password/forgot");
		await expect(page.locator("h1")).toContainText("Beer Salon");
		await expect(page.locator("p").first()).toContainText("パスワード再設定");
	});

	test("/password/forgotでメールアドレスを送信すると完了トーストが表示される", async ({
		page,
	}) => {
		await page.goto("/password/forgot");

		await page.locator('input[name="email"]').fill("test@example.com");
		await page.getByRole("button", { name: "再設定メールを送信" }).click();

		// Why not: 「該当アドレスが登録されていればメールを送信しました」は登録有無を区別しない
		// 中立メッセージ。Sonner のトーストとして表示されることを部分一致で確認する。
		await expect(page.getByText(/該当アドレス/)).toBeVisible();
	});
});
