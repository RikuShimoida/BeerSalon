import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
	test("should display login page with email and password fields", async ({
		page,
	}) => {
		await page.goto("/login");

		// ページタイトルを確認
		await expect(
			page.getByRole("heading", { name: "BeerSalonAdmin" }),
		).toBeVisible();

		// メールアドレス入力欄を確認
		await expect(page.getByLabel("メールアドレス")).toBeVisible();

		// パスワード入力欄を確認
		await expect(page.getByLabel("パスワード")).toBeVisible();

		// ログインボタンを確認
		await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
	});

	test("should show error when email or password is empty", async ({
		page,
	}) => {
		await page.goto("/login");

		// ログインボタンをクリック（何も入力せずに）
		await page.getByRole("button", { name: "ログイン" }).click();

		// エラーメッセージを確認
		await expect(page.getByText("入力してください")).toBeVisible();
	});

	test("should show error with invalid credentials", async ({ page }) => {
		await page.goto("/login");

		// 間違った認証情報を入力
		await page.getByLabel("メールアドレス").fill("wrong@example.com");
		await page.getByLabel("パスワード").fill("wrongpassword");

		// ログインボタンをクリック
		await page.getByRole("button", { name: "ログイン" }).click();

		// エラーメッセージを確認
		await expect(
			page.getByText("メールアドレスまたはパスワードが正しくありません"),
		).toBeVisible();
	});

	test("should successfully login with valid credentials and redirect to dashboard", async ({
		page,
	}) => {
		await page.goto("/login");

		// 正しい認証情報を入力（テストデータベースに存在する必要がある）
		await page.getByLabel("メールアドレス").fill("owner@example.com");
		await page.getByLabel("パスワード").fill("password123");

		// ログインボタンをクリック
		await page.getByRole("button", { name: "ログイン" }).click();

		// ダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/");
		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();
	});

	test("should redirect to login page when accessing protected route without authentication", async ({
		page,
	}) => {
		// 未認証状態でダッシュボードにアクセス
		await page.goto("/");

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("should logout and redirect to login page", async ({ page }) => {
		// まずログイン
		await page.goto("/login");
		await page.getByLabel("メールアドレス").fill("owner@example.com");
		await page.getByLabel("パスワード").fill("password123");
		await page.getByRole("button", { name: "ログイン" }).click();

		// ダッシュボードにいることを確認
		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();

		// ログアウトボタンをクリック
		await page.getByRole("button", { name: "ログアウト" }).click();

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("should retrieve session information after login", async ({
		page,
		request: _request,
	}) => {
		// ログイン
		await page.goto("/login");
		await page.getByLabel("メールアドレス").fill("owner@example.com");
		await page.getByLabel("パスワード").fill("password123");
		await page.getByRole("button", { name: "ログイン" }).click();

		// ダッシュボードにいることを確認
		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();

		// セッション情報を取得
		const cookies = await page.context().cookies();
		const adminToken = cookies.find((cookie) => cookie.name === "admin-token");

		// トークンが存在することを確認
		expect(adminToken).toBeDefined();
		expect(adminToken?.value).toBeTruthy();
	});

	test("should not allow inactive users to login", async ({ page }) => {
		await page.goto("/login");

		// is_active=false のユーザーでログイン試行（テストデータに存在する必要がある）
		await page.getByLabel("メールアドレス").fill("inactive@example.com");
		await page.getByLabel("パスワード").fill("password123");

		// ログインボタンをクリック
		await page.getByRole("button", { name: "ログイン" }).click();

		// エラーメッセージを確認
		await expect(
			page.getByText("メールアドレスまたはパスワードが正しくありません"),
		).toBeVisible();
	});
});
