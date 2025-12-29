import { expect, test } from "@playwright/test";
import { fillSignUpForm, generateTestUser } from "./helpers/auth";

test.describe("新規登録ページ", () => {
	test("新規登録ページにアクセスできる", async ({ page }) => {
		await page.goto("/signup");
		await expect(page).toHaveURL("/signup");
		await expect(page.locator("h1")).toContainText("Beer Salon");
		await expect(page.locator("p")).toContainText("新規登録");
	});

	test("メールアドレスとパスワードの入力欄が表示される", async ({ page }) => {
		await page.goto("/signup");

		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("パスワード入力欄の下に強度チェックのヒントが表示される", async ({
		page,
	}) => {
		await page.goto("/signup");

		await expect(
			page.locator("text=/8文字以上.*大文字.*小文字.*数字.*記号/"),
		).toBeVisible();
	});

	test("ログインページへのリンクが表示され、クリックでログインページに遷移する", async ({
		page,
	}) => {
		await page.goto("/signup");

		const loginLink = page.locator('a[href="/login"]');
		await expect(loginLink).toBeVisible();
		await expect(loginLink).toContainText("ログインはこちら");

		await loginLink.click();
		await expect(page).toHaveURL("/login");
	});

	test("未入力で送信するとHTML5バリデーションエラーが発生する", async ({
		page,
	}) => {
		await page.goto("/signup");

		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();

		const emailInput = page.locator('input[name="email"]');
		const isEmailInvalid = await emailInput.evaluate(
			(el: HTMLInputElement) => !el.validity.valid,
		);
		expect(isEmailInvalid).toBe(true);
	});

	test("不正なメールアドレス形式を入力するとHTML5バリデーションエラーが発生する", async ({
		page,
	}) => {
		await page.goto("/signup");

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

	test("弱いパスワードを入力すると登録に失敗する", async ({ page }) => {
		await page.goto("/signup");

		const user = generateTestUser();
		await page.fill('input[name="email"]', user.email);
		await page.fill('input[name="password"]', "weak");
		await page.click('button[type="submit"]');

		await page.waitForSelector("text=登録", { timeout: 10000 });

		const errorMessage = page.locator("text=/パスワード|登録に失敗|エラー/");
		const hasError = (await errorMessage.count()) > 0;
		expect(hasError).toBe(true);
	});

	test("有効なメールアドレスとパスワードで登録すると成功メッセージが表示される", async ({
		page,
	}) => {
		await page.goto("/signup");

		const user = generateTestUser();
		await fillSignUpForm(page, user);

		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		await expect(page.locator("text=/確認メールを送信しました/")).toBeVisible();
	});

	test("既に登録済みのメールアドレスで登録するとエラーメッセージが表示される", async ({
		page,
	}) => {
		await page.goto("/signup");

		const user = generateTestUser();
		await fillSignUpForm(page, user);

		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		await page.goto("/signup");
		await fillSignUpForm(page, user);

		await page.waitForSelector("text=登録", { timeout: 10000 });

		const errorMessage = page.locator("text=/既に登録|すでに使用|登録に失敗/");
		const hasError = (await errorMessage.count()) > 0;
		expect(hasError).toBe(true);
	});
});
