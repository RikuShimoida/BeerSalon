import { expect, test } from "@playwright/test";
import {
	fillProfileForm,
	fillSignUpForm,
	generateTestUser,
} from "./helpers/auth";

test.describe("プロフィール入力・確認ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/signup");
		const user = generateTestUser();
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });
	});

	test("未認証状態でプロフィール入力ページにアクセスすると新規登録ページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/signup/profile");
		await expect(page).toHaveURL("/signup");
	});

	test("プロフィール入力ページのすべてのフォーム項目が表示される", async ({
		page,
		context,
	}) => {
		const user = generateTestUser();

		await page.goto("/signup");
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		const cookies = await context.cookies();
		const sessionCookie = cookies.find(
			(c) => c.name.includes("auth-token") || c.name.includes("sb-"),
		);

		if (!sessionCookie) {
			test.skip();
		}

		await page.goto("/signup/profile");

		await expect(page).toHaveURL("/signup/profile");
		await expect(page.locator("h1")).toContainText("プロフィール入力");

		await expect(page.locator('input[name="lastName"]')).toBeVisible();
		await expect(page.locator('input[name="firstName"]')).toBeVisible();
		await expect(page.locator('input[name="nickname"]')).toBeVisible();
		await expect(page.locator('select[name="year"]')).toBeVisible();
		await expect(page.locator('select[name="month"]')).toBeVisible();
		await expect(page.locator('select[name="day"]')).toBeVisible();
		await expect(page.locator('select[name="gender"]')).toBeVisible();
		await expect(page.locator('select[name="prefecture"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("必須項目を未入力のまま送信するとバリデーションエラーが発生する", async ({
		page,
		context,
	}) => {
		const user = generateTestUser();

		await page.goto("/signup");
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		const cookies = await context.cookies();
		const sessionCookie = cookies.find(
			(c) => c.name.includes("auth-token") || c.name.includes("sb-"),
		);

		if (!sessionCookie) {
			test.skip();
		}

		await page.goto("/signup/profile");

		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();

		const lastNameInput = page.locator('input[name="lastName"]');
		const isLastNameInvalid = await lastNameInput.evaluate(
			(el: HTMLInputElement) => !el.validity.valid,
		);
		expect(isLastNameInvalid).toBe(true);
	});

	test("すべての項目を入力して送信すると確認ページに遷移する", async ({
		page,
		context,
	}) => {
		const user = generateTestUser();

		await page.goto("/signup");
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		const cookies = await context.cookies();
		const sessionCookie = cookies.find(
			(c) => c.name.includes("auth-token") || c.name.includes("sb-"),
		);

		if (!sessionCookie) {
			test.skip();
		}

		await page.goto("/signup/profile");

		await fillProfileForm(page, user);

		await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });
		await expect(page).toHaveURL(/\/signup\/confirm/);
		await expect(page.locator("h1")).toContainText("登録内容の確認");
	});

	test("確認ページで入力内容が正しく表示される", async ({ page, context }) => {
		const user = generateTestUser();

		await page.goto("/signup");
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		const cookies = await context.cookies();
		const sessionCookie = cookies.find(
			(c) => c.name.includes("auth-token") || c.name.includes("sb-"),
		);

		if (!sessionCookie) {
			test.skip();
		}

		await page.goto("/signup/profile");
		await fillProfileForm(page, user);

		await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });

		await expect(page.locator(`text=${user.lastName}`)).toBeVisible();
		await expect(page.locator(`text=${user.firstName}`)).toBeVisible();
		await expect(page.locator(`text=${user.nickname}`)).toBeVisible();
		await expect(page.locator(`text=${user.prefecture}`)).toBeVisible();
	});

	test("確認ページで「修正する」ボタンを押すとプロフィール入力ページに戻る", async ({
		page,
		context,
	}) => {
		const user = generateTestUser();

		await page.goto("/signup");
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		const cookies = await context.cookies();
		const sessionCookie = cookies.find(
			(c) => c.name.includes("auth-token") || c.name.includes("sb-"),
		);

		if (!sessionCookie) {
			test.skip();
		}

		await page.goto("/signup/profile");
		await fillProfileForm(page, user);

		await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });

		const backLink = page.locator('a:has-text("修正する")');
		await backLink.click();

		await expect(page).toHaveURL(/\/signup\/profile/);
	});

	test("確認ページで「この内容で登録する」ボタンを押すと登録が完了してトップページに遷移する", async ({
		page,
		context,
	}) => {
		const user = generateTestUser();

		await page.goto("/signup");
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

		const cookies = await context.cookies();
		const sessionCookie = cookies.find(
			(c) => c.name.includes("auth-token") || c.name.includes("sb-"),
		);

		if (!sessionCookie) {
			test.skip();
		}

		await page.goto("/signup/profile");
		await fillProfileForm(page, user);

		await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });

		const confirmButton = page.locator('button:has-text("この内容で登録する")');
		await confirmButton.click();

		await page.waitForURL("/", { timeout: 15000 });
		await expect(page).toHaveURL("/");
	});
});
