import { expect, test } from "@playwright/test";
import { fillLoginForm, generateTestUser } from "./helpers/auth";

test.describe("ログインページ", () => {
	test("ログインページにアクセスできる", async ({ page }) => {
		await page.goto("/login");
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1")).toContainText("Beer Salon");
		await expect(page.locator("p")).toContainText("ログイン");
	});

	test("メールアドレスとパスワードの入力欄が表示される", async ({ page }) => {
		await page.goto("/login");

		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("新規登録リンクが表示され、クリックで新規登録ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/login");

		const signupLink = page.locator('a[href="/signup"]');
		await expect(signupLink).toBeVisible();
		await expect(signupLink).toContainText("新規登録はこちら");

		await signupLink.click();
		await expect(page).toHaveURL("/signup");
	});

	test("パスワード再設定リンクが表示され、クリックでパスワード再設定ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/login");

		const resetLink = page.locator('a[href="/password/reset"]');
		await expect(resetLink).toBeVisible();
		await expect(resetLink).toContainText("パスワードをお忘れの方");

		await resetLink.click();
		await expect(page).toHaveURL("/password/reset");
	});

	test("未入力で送信するとHTML5バリデーションエラーが発生する", async ({
		page,
	}) => {
		await page.goto("/login");

		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();

		const emailInput = page.locator('input[name="email"]');
		const isEmailInvalid = await emailInput.evaluate(
			(el: HTMLInputElement) => !el.validity.valid,
		);
		expect(isEmailInvalid).toBe(true);
	});

	test("存在しないメールアドレスでログインするとエラーメッセージが表示される", async ({
		page,
	}) => {
		await page.goto("/login");

		const user = generateTestUser();
		await fillLoginForm(page, user.email, user.password);

		await page.waitForSelector("text=ログイン", { timeout: 10000 });

		const errorMessage = page.locator(
			"text=/ログインに失敗|メールアドレスまたはパスワードが正しくありません/",
		);
		const hasError = (await errorMessage.count()) > 0;
		expect(hasError).toBe(true);
	});

	test("不正なメールアドレス形式を入力するとHTML5バリデーションエラーが発生する", async ({
		page,
	}) => {
		await page.goto("/login");

		await page.fill('input[name="email"]', "invalid-email");
		await page.fill('input[name="password"]', "Test1234!@#");

		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();

		const emailInput = page.locator('input[name="email"]');
		const isEmailInvalid = await emailInput.evaluate(
			(el: HTMLInputElement) => !el.validity.valid,
		);
		expect(isEmailInvalid).toBe(true);
	});
});
