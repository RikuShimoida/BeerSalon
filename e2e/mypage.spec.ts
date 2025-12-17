import { expect, test } from "@playwright/test";

test.describe("マイページ", () => {
	test("受入条件1: 未ログイン状態で /mypage にアクセスすると /login にリダイレクトされる", async ({
		page,
		context,
	}) => {
		await context.clearCookies();
		await page.goto("http://localhost:3000/mypage");
		await expect(page).toHaveURL(/\/login/);
	});

	test("受入条件2: ログイン中ユーザーの情報のみが表示される", async ({
		page,
	}) => {
		await page.goto("http://localhost:3000/login");
		await page.fill('input[type="email"]', "test@example.com");
		await page.fill('input[type="password"]', "password123");
		await page.click('button:has-text("ログイン")');
		await page.waitForURL("http://localhost:3000/", { timeout: 10000 });

		await page.goto("http://localhost:3000/mypage");

		await expect(page.getByRole("heading", { name: "マイページ" })).toBeVisible();
		await expect(page.getByText("テストユーザー")).toBeVisible();
	});

	test("受入条件3: 各メニューリンクが正しいページへ遷移する", async ({
		page,
	}) => {
		await page.goto("http://localhost:3000/login");
		await page.fill('input[type="email"]', "test@example.com");
		await page.fill('input[type="password"]', "password123");
		await page.click('button:has-text("ログイン")');
		await page.waitForURL("http://localhost:3000/", { timeout: 10000 });

		await page.goto("http://localhost:3000/mypage");

		await expect(page.getByText("フォロー")).toBeVisible();
		await expect(page.getByText("フォロワー")).toBeVisible();
		await expect(page.getByText("投稿")).toBeVisible();
		await expect(page.getByText("持っているクーポン")).toBeVisible();

		await page.click('a:has-text("フォロー")');
		await expect(page).toHaveURL(/\/mypage\/following/);
	});
});
