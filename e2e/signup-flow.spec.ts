import { expect, test } from "@playwright/test";
import {
	deleteAllEmails,
	extractConfirmationLink,
	getEmailContent,
	waitForEmail,
} from "./helpers/mailpit";

test.describe("新規登録フロー", () => {
	test.beforeEach(async () => {
		await deleteAllEmails();
	});

	test("新規登録からプロフィール入力まで完了できる", async ({ page }) => {
		const testEmail = `test-${Date.now()}@example.com`;
		const testPassword = "TestPassword123!";

		await page.goto("/signup");
		await expect(page).toHaveURL("/signup");

		await page.fill('input[type="email"]', testEmail);
		await page.fill('input[type="password"]', testPassword);

		await page.click('button:has-text("登録")');

		await expect(page.getByText(/確認メール|メールを送信/)).toBeVisible({
			timeout: 10000,
		});

		const email = await waitForEmail(testEmail, {
			subject: "Confirm",
			timeout: 30000,
		});

		expect(email).toBeDefined();
		expect(email.To[0].Address).toBe(testEmail);

		const { html } = await getEmailContent(email.ID);
		const confirmationLink = extractConfirmationLink(html);

		expect(confirmationLink).toBeTruthy();
		if (!confirmationLink) {
			throw new Error("確認リンクがメールから抽出できませんでした");
		}

		await page.goto(confirmationLink);

		await page.waitForLoadState("networkidle", { timeout: 20000 });

		await page.waitForURL((url) => url.pathname === "/signup/profile", {
			timeout: 15000,
		});

		await expect(page).toHaveURL("/signup/profile");

		await page.fill('input[name="lastName"]', "テスト");
		await page.fill('input[name="firstName"]', "太郎");
		await page.fill('input[name="nickname"]', "テストユーザー");

		await page.selectOption('select[name="birthdayYear"]', "1990");
		await page.selectOption('select[name="birthdayMonth"]', "1");
		await page.selectOption('select[name="birthdayDay"]', "1");

		await page.selectOption('select[name="gender"]', "male");
		await page.selectOption('select[name="prefecture"]', "静岡県");

		await page.click('button:has-text("登録内容を確認")');

		await page.waitForURL("/signup/confirm", { timeout: 5000 });
		await expect(page).toHaveURL("/signup/confirm");

		await expect(page.getByText("テスト")).toBeVisible();
		await expect(page.getByText("太郎")).toBeVisible();
		await expect(page.getByText("テストユーザー")).toBeVisible();
		await expect(page.getByText("1990")).toBeVisible();
		await expect(page.getByText("男性")).toBeVisible();
		await expect(page.getByText("静岡県")).toBeVisible();

		await page.click('button:has-text("この内容で登録する")');

		await page.waitForURL("/", { timeout: 10000 });
		await expect(page).toHaveURL("/");
	});

	test("新規登録でバリデーションエラーが表示される", async ({ page }) => {
		await page.goto("/signup");

		await page.fill('input[type="email"]', "invalid-email");
		await page.fill('input[type="password"]', "weak");

		await page.click('button:has-text("登録")');

		await expect(
			page
				.locator("div")
				.filter({ hasText: /エラー|無効|失敗/ })
				.first(),
		).toBeVisible({ timeout: 10000 });
	});

	test("プロフィール入力でバリデーションエラーが表示される", async ({
		page,
	}) => {
		const testEmail = `test-profile-${Date.now()}@example.com`;
		const testPassword = "TestPassword123!";

		await page.goto("/signup");
		await page.fill('input[type="email"]', testEmail);
		await page.fill('input[type="password"]', testPassword);
		await page.click('button:has-text("登録")');

		const email = await waitForEmail(testEmail, {
			subject: "Confirm",
			timeout: 30000,
		});
		const { html } = await getEmailContent(email.ID);
		const confirmationLink = extractConfirmationLink(html);

		if (!confirmationLink) {
			throw new Error("確認リンクが見つかりません");
		}

		await page.goto(confirmationLink);
		await page.waitForURL((url) => url.pathname === "/signup/profile", {
			timeout: 15000,
		});
		await page.waitForLoadState("networkidle");

		await page.click('button:has-text("登録内容を確認")');

		await expect(
			page
				.locator("div")
				.filter({ hasText: /エラー|必須|入力/ })
				.first(),
		).toBeVisible({ timeout: 10000 });
	});
});
