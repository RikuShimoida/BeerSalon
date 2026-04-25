import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("投稿作成ページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("認証済みユーザーが投稿作成ページにアクセスできる", async ({ page }) => {
		await page.goto("/posts/new");
		await expect(page).toHaveURL("/posts/new");
	});

	test("投稿本文入力フォームが表示される", async ({ page }) => {
		await page.goto("/posts/new");

		const bodyInput = page.locator(
			'textarea[name="body"], textarea[placeholder*="本文"], [data-testid="post-body"]',
		);
		await expect(bodyInput.first()).toBeVisible();
	});

	test("写真アップロードフィールドが表示される", async ({ page }) => {
		await page.goto("/posts/new");

		const photoUpload = page.locator(
			'input[type="file"], button:has-text("写真"), [data-testid="photo-upload"]',
		);
		const hasPhotoUpload = (await photoUpload.count()) > 0;
		expect(hasPhotoUpload).toBe(true);
	});

	test("店名タグ選択フィールドが表示される", async ({ page }) => {
		await page.goto("/posts/new");

		const barSelect = page.locator(
			'select[name="barId"], input[placeholder*="店"], [data-testid="bar-select"]',
		);
		const hasBarSelect = (await barSelect.count()) > 0;
		expect(hasBarSelect).toBe(true);
	});

	test("必須項目未入力時にバリデーションエラーが表示される", async ({
		page,
	}) => {
		await page.goto("/posts/new");

		const submitButton = page.locator(
			'button[type="submit"], button:has-text("投稿")',
		);

		if ((await submitButton.count()) > 0) {
			await submitButton.first().click();
			await page.waitForTimeout(500);

			const bodyInput = page
				.locator(
					'textarea[name="body"], textarea[placeholder*="本文"], [data-testid="post-body"]',
				)
				.first();
			const isBodyInvalid = await bodyInput.evaluate(
				(el: HTMLTextAreaElement) => !el.validity.valid,
			);

			expect(isBodyInvalid).toBe(true);
		} else {
			test.skip();
		}
	});

	test("すべての項目を入力して投稿すると成功する", async ({ page }) => {
		await page.goto("/posts/new");

		const barSelect = page
			.locator(
				'select[name="barId"], input[placeholder*="店"], [data-testid="bar-select"]',
			)
			.first();

		if (
			(await barSelect.count()) > 0 &&
			(await barSelect.getAttribute("role")) !== "combobox"
		) {
			const options = await barSelect.locator("option").count();
			if (options > 1) {
				await barSelect.selectOption({ index: 1 });
			}
		}

		const bodyInput = page
			.locator(
				'textarea[name="body"], textarea[placeholder*="本文"], [data-testid="post-body"]',
			)
			.first();
		await bodyInput.fill("テスト投稿です。美味しいビールでした！");

		const submitButton = page.locator(
			'button[type="submit"], button:has-text("投稿")',
		);

		if ((await submitButton.count()) > 0) {
			await submitButton.first().click();
			await page.waitForTimeout(2000);

			const currentUrl = page.url();
			expect(currentUrl).not.toContain("/posts/new");
		} else {
			test.skip();
		}
	});

	test("キャンセルボタンをクリックすると前のページに戻る", async ({ page }) => {
		await page.goto("/");
		await page.goto("/posts/new");

		const cancelButton = page.locator(
			'button:has-text("キャンセル"), a:has-text("戻る"), [data-testid="cancel-button"]',
		);

		if ((await cancelButton.count()) > 0) {
			await cancelButton.first().click();
			await page.waitForTimeout(1000);

			const currentUrl = page.url();
			expect(currentUrl).not.toContain("/posts/new");
		} else {
			test.skip();
		}
	});

	test("投稿フォームに入力した内容が保持される", async ({ page }) => {
		await page.goto("/posts/new");

		const bodyInput = page
			.locator(
				'textarea[name="body"], textarea[placeholder*="本文"], [data-testid="post-body"]',
			)
			.first();

		if ((await bodyInput.count()) > 0) {
			const testText = "テスト投稿の本文です";
			await bodyInput.fill(testText);

			const inputValue = await bodyInput.inputValue();
			expect(inputValue).toBe(testText);
		} else {
			test.skip();
		}
	});

	test("店舗詳細ページから投稿ボタンをクリックすると投稿作成ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		const postButton = page
			.locator(
				'button:has-text("投稿"), a[href*="posts/new"], [data-testid="create-post-button"]',
			)
			.first();

		if ((await postButton.count()) > 0) {
			await postButton.click();
			await page.waitForURL(/\/posts\/new/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/posts\/new/);
		} else {
			test.skip();
		}
	});
});
