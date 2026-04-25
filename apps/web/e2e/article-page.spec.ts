import { expect, test } from "@playwright/test";

test.describe("記事ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("http://localhost:3000/login");

		await page.fill('input[type="email"]', "test@example.com");
		await page.fill('input[type="password"]', "password123");

		await page.click('button:has-text("ログイン")');

		await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
	});

	test("受入条件1: /articles/[articleId] にアクセスすると該当記事が表示される", async ({
		page,
	}) => {
		await page.goto("http://localhost:3000/articles/1");

		await expect(page).toHaveURL(/\/articles\/1/);

		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		await expect(page.getByText("新しいビールが入荷しました！")).toBeVisible();
	});

	test("受入条件2: 存在しない articleId の場合、404 ページが表示される", async ({
		page,
	}) => {
		await page.goto("http://localhost:3000/articles/9999");

		await expect(page.getByText(/404|Not Found/i)).toBeVisible();
	});

	test("受入条件3: 未ログイン状態でアクセスした場合、ログインページへ遷移する", async ({
		page,
		context,
	}) => {
		await context.clearCookies();

		await page.goto("http://localhost:3000/articles/1");

		await expect(page).toHaveURL(/\/login/);
	});

	test("受入条件4: 店舗詳細ページから記事ページへの導線が成立している", async ({
		page,
	}) => {
		await page.goto("http://localhost:3000/bars/1");

		await page.getByRole("button", { name: "お店からの投稿" }).click();

		await expect(page.getByText("新しいビールが入荷しました！")).toBeVisible();

		await page.getByText("新しいビールが入荷しました！").click();

		await expect(page).toHaveURL(/\/articles\/1/);

		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});

	test("記事詳細ページに必要な情報が表示される", async ({ page }) => {
		await page.goto("http://localhost:3000/articles/1");

		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		await expect(page.getByText("ビアバー サンプル")).toBeVisible();

		await expect(
			page.getByRole("link", { name: "店舗詳細を見る" }),
		).toBeVisible();
	});

	test("店舗詳細へのリンクが正しく動作する", async ({ page }) => {
		await page.goto("http://localhost:3000/articles/1");

		await page.getByRole("link", { name: "店舗詳細を見る" }).click();

		await expect(page).toHaveURL(/\/bars\/1/);

		await expect(
			page.getByRole("heading", { name: /ビアバー サンプル/ }),
		).toBeVisible();
	});
});
