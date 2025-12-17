import { expect, test } from "@playwright/test";

test.describe("店舗詳細ページ（認証済み）", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("http://localhost:3000/login");

		await page.fill('input[type="email"]', "test@example.com");
		await page.fill('input[type="password"]', "password123");

		await page.click('button:has-text("ログイン")');

		await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
	});

	test("受入条件1: /bars/[barId] にアクセスできる", async ({ page }) => {
		await page.goto("http://localhost:3000/bars/1");

		await expect(page).toHaveURL(/\/bars\/1/);

		await expect(
			page.getByRole("heading", { name: /ビアバー サンプル/ }),
		).toBeVisible();
	});

	test("受入条件2: 各タブが表示・切り替えできる", async ({ page }) => {
		await page.goto("http://localhost:3000/bars/1");

		await expect(page.getByRole("button", { name: "基本情報" })).toBeVisible();
		await expect(page.getByRole("button", { name: "メニュー" })).toBeVisible();
		await expect(
			page.getByRole("button", { name: "タグ付けされた投稿" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "お店からの投稿" }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: "クーポン" })).toBeVisible();

		await page.getByRole("button", { name: "メニュー" }).click();
		await expect(page.getByRole("heading", { name: "Beers" })).toBeVisible();

		await page.getByRole("button", { name: "クーポン" }).click();
		await expect(page.getByText("初回来店クーポン")).toBeVisible();

		await page.getByRole("button", { name: "お店からの投稿" }).click();
		await expect(page.getByText("新しいビールが入荷しました！")).toBeVisible();

		await page.getByRole("button", { name: "基本情報" }).click();
		await expect(page.getByText("PR文")).toBeVisible();
	});

	test("受入条件3: データが正しく表示される", async ({ page }) => {
		await page.goto("http://localhost:3000/bars/1");

		await expect(page.getByText("静岡県").first()).toBeVisible();
		await expect(page.getByText("静岡市").first()).toBeVisible();
		await expect(
			page.getByText(/静岡駅近くのクラフトビール専門店/),
		).toBeVisible();

		await page.getByRole("button", { name: "メニュー" }).click();
		await expect(page.getByText("静岡ペールエール")).toBeVisible();
		await expect(page.getByText("フライドポテト")).toBeVisible();

		await page.getByRole("button", { name: "クーポン" }).click();
		await expect(page.getByText("初回来店時にビール1杯無料")).toBeVisible();
	});

	test("受入条件4: 認証されていない場合は適切にリダイレクトされる", async ({
		page,
		context,
	}) => {
		await context.clearCookies();

		await page.goto("http://localhost:3000/bars/1");

		await expect(page).toHaveURL(/\/login/);
	});
});
