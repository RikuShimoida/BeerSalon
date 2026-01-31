import path from "node:path";
import { expect, test } from "@playwright/test";
import { fillSignUpForm, generateTestUser } from "./helpers/auth";

test.describe("プロフィール画像アップロード", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/signup");
		const user = generateTestUser();
		await fillSignUpForm(page, user);
		await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });
	});

	test("プロフィール画像をアップロードして登録が完了する", async ({
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

		await page.fill('input[name="lastName"]', user.lastName);
		await page.fill('input[name="firstName"]', user.firstName);
		await page.fill('input[name="nickname"]', user.nickname);
		await page.selectOption('select[name="year"]', user.year);
		await page.selectOption('select[name="month"]', user.month);
		await page.selectOption('select[name="day"]', user.day);
		await page.selectOption('select[name="gender"]', user.gender);
		await page.selectOption('select[name="prefecture"]', user.prefecture);

		const fileInput = page.locator('input[type="file"]');
		const testImagePath = path.join(
			process.cwd(),
			"e2e",
			"fixtures",
			"test-profile.png",
		);
		await fileInput.setInputFiles(testImagePath);

		await page.waitForTimeout(500);

		const preview = page.locator('img[alt="プロフィール画像プレビュー"]');
		await expect(preview).toBeVisible();

		await page.click('button[type="submit"]');

		await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });

		const confirmPageImage = page.locator('img[alt="プロフィール画像"]');
		await expect(confirmPageImage).toBeVisible();

		await expect(page.locator(`text=${user.lastName}`)).toBeVisible();
		await expect(page.locator(`text=${user.firstName}`)).toBeVisible();
		await expect(page.locator(`text=${user.nickname}`)).toBeVisible();

		const confirmButton = page.locator('button:has-text("この内容で登録する")');
		await confirmButton.click();

		await page.waitForURL("/", { timeout: 15000 });
		await expect(page).toHaveURL("/");
	});

	test("画像なしでもプロフィール登録が完了する", async ({ page, context }) => {
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

		await page.fill('input[name="lastName"]', user.lastName);
		await page.fill('input[name="firstName"]', user.firstName);
		await page.fill('input[name="nickname"]', user.nickname);
		await page.selectOption('select[name="year"]', user.year);
		await page.selectOption('select[name="month"]', user.month);
		await page.selectOption('select[name="day"]', user.day);
		await page.selectOption('select[name="gender"]', user.gender);
		await page.selectOption('select[name="prefecture"]', user.prefecture);

		await page.click('button[type="submit"]');

		await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });

		const confirmButton = page.locator('button:has-text("この内容で登録する")');
		await confirmButton.click();

		await page.waitForURL("/", { timeout: 15000 });
		await expect(page).toHaveURL("/");
	});

	test("プロフィール画像のプレビューが正しく表示される", async ({
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

		const fileInput = page.locator('input[type="file"]');
		const testImagePath = path.join(
			process.cwd(),
			"e2e",
			"fixtures",
			"test-profile.png",
		);

		await fileInput.setInputFiles(testImagePath);

		await page.waitForTimeout(500);

		const preview = page.locator('img[alt="プロフィール画像プレビュー"]');
		await expect(preview).toBeVisible();

		const src = await preview.getAttribute("src");
		expect(src).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
	});
});
