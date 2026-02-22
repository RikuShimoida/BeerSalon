import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";
import {
	cleanup,
	ensureBarWithFacebookUrl,
	ensureBarWithoutFacebookUrl,
} from "./helpers/database";

let barIdWithFacebookUrl: bigint;
let barIdWithoutFacebookUrl: bigint;

test.describe("店舗詳細ページ - Facebook URL表示", () => {
	test.beforeAll(async () => {
		barIdWithFacebookUrl = await ensureBarWithFacebookUrl();
		barIdWithoutFacebookUrl = await ensureBarWithoutFacebookUrl();
	});

	test.afterAll(async () => {
		await cleanup();
	});

	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("Facebook URL登録済み店舗ではアイコンとユーザー名が表示される", async ({
		page,
	}) => {
		await page.goto(`/bars/${barIdWithFacebookUrl}`, {
			waitUntil: "networkidle",
		});

		await page.reload({ waitUntil: "networkidle" });

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(1000);

		const facebookSection = page.locator("text=/Facebook/i");
		const facebookLink = page.locator('a[href*="facebook.com"]');

		await expect(facebookSection.first()).toBeVisible();
		await expect(facebookLink.first()).toBeVisible();

		await expect(facebookLink.first()).toHaveAttribute(
			"href",
			"https://www.facebook.com/beersalon.test",
		);
		await expect(facebookLink.first()).toHaveAttribute("target", "_blank");
		await expect(facebookLink.first()).toHaveAttribute(
			"rel",
			"nofollow noopener",
		);
		await expect(facebookLink.first()).toHaveAttribute(
			"aria-label",
			"Facebookで見る",
		);

		const facebookIcon = facebookLink.first().locator("svg").first();
		await expect(facebookIcon).toBeVisible();

		const usernameText = facebookLink.first().locator("span");
		await expect(usernameText).toContainText("@beersalon.test");
	});

	test("Facebook URL未登録店舗では表示されない", async ({ page }) => {
		await page.goto(`/bars/${barIdWithoutFacebookUrl}`);

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(500);

		const facebookLink = page.locator('a[href*="facebook.com"]');
		await expect(facebookLink).not.toBeVisible();

		const facebookSection = page.locator("text=/Facebook/i");
		await expect(facebookSection).not.toBeVisible();
	});

	test("Facebook URLリンクをクリックすると新規タブで開く", async ({
		page,
		context,
	}) => {
		await page.goto(`/bars/${barIdWithFacebookUrl}`, {
			waitUntil: "networkidle",
		});

		await page.reload({ waitUntil: "networkidle" });

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(1000);

		const facebookLink = page.locator('a[href*="facebook.com"]');

		const [newPage] = await Promise.all([
			context.waitForEvent("page"),
			facebookLink.first().click(),
		]);

		expect(newPage.url()).toContain("facebook.com");

		await newPage.close();
	});

	test("Facebook URLリンクにrel属性が正しく設定されている", async ({
		page,
	}) => {
		await page.goto(`/bars/${barIdWithFacebookUrl}`, {
			waitUntil: "networkidle",
		});

		await page.reload({ waitUntil: "networkidle" });

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(1000);

		const facebookLink = page.locator('a[href*="facebook.com"]');

		await expect(facebookLink.first()).toBeVisible();

		const rel = await facebookLink.first().getAttribute("rel");
		expect(rel).toBe("nofollow noopener");

		const target = await facebookLink.first().getAttribute("target");
		expect(target).toBe("_blank");
	});

	test("Facebook URLアイコンがhover時に青色に変化する", async ({ page }) => {
		await page.goto(`/bars/${barIdWithFacebookUrl}`, {
			waitUntil: "networkidle",
		});

		await page.reload({ waitUntil: "networkidle" });

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(1000);

		const facebookLink = page.locator('a[href*="facebook.com"]');

		await expect(facebookLink.first()).toBeVisible();

		const classAttr = await facebookLink.first().getAttribute("class");
		expect(classAttr).toContain("hover:text-blue-600");
	});
});
