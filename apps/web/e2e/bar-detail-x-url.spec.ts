import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";
import {
	cleanup,
	ensureBarWithoutXUrl,
	ensureBarWithXUrl,
} from "./helpers/database";

let barIdWithXUrl: bigint;
let barIdWithoutXUrl: bigint;

test.describe("店舗詳細ページ - X（Twitter）URL", () => {
	test.beforeAll(async () => {
		barIdWithXUrl = await ensureBarWithXUrl();
		barIdWithoutXUrl = await ensureBarWithoutXUrl();
	});

	test.afterAll(async () => {
		await cleanup();
	});

	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("X URL登録済み店舗ではXリンクが表示される", async ({ page }) => {
		await page.goto(`/bars/${barIdWithXUrl}`, {
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

		const xSection = page.locator("text=/X（Twitter）/i");
		const xLink = page.locator('a[href*="x.com"], a[href*="twitter.com"]');

		await expect(xSection.first()).toBeVisible();
		await expect(xLink.first()).toBeVisible();

		const rel = await xLink.first().getAttribute("rel");
		expect(rel).toBe("nofollow noopener");

		const target = await xLink.first().getAttribute("target");
		expect(target).toBe("_blank");
	});

	test("X URL未登録店舗ではXリンクが表示されない", async ({ page }) => {
		await page.goto(`/bars/${barIdWithoutXUrl}`);

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(500);

		const xLink = page.locator('a[href*="x.com"], a[href*="twitter.com"]');
		await expect(xLink).not.toBeVisible();

		const xSection = page.locator("text=/X（Twitter）/i");
		await expect(xSection).not.toBeVisible();
	});

	test("Xリンクには正しいrel属性とtarget属性が設定されている", async ({
		page,
	}) => {
		await page.goto(`/bars/${barIdWithXUrl}`, {
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

		const xLink = page.locator('a[href*="x.com"], a[href*="twitter.com"]');

		await expect(xLink.first()).toBeVisible();

		const rel = await xLink.first().getAttribute("rel");
		expect(rel).toBe("nofollow noopener");

		const target = await xLink.first().getAttribute("target");
		expect(target).toBe("_blank");
	});
});
