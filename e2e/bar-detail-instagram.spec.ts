import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";
import {
	cleanup,
	ensureBarWithInstagram,
	ensureBarWithoutInstagram,
} from "./helpers/database";

let barIdWithInstagram: bigint;
let barIdWithoutInstagram: bigint;

test.describe("店舗詳細ページ - Instagram URL", () => {
	test.beforeAll(async () => {
		barIdWithInstagram = await ensureBarWithInstagram();
		barIdWithoutInstagram = await ensureBarWithoutInstagram();
	});

	test.afterAll(async () => {
		await cleanup();
	});

	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("Instagram URL登録済み店舗ではInstagramリンクが表示される", async ({
		page,
	}) => {
		await page.goto(`/bars/${barIdWithInstagram}`, {
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

		const pageContent = await page.content();
		console.log("Page has Instagram text:", pageContent.includes("Instagram"));
		console.log(
			"Page has instagram.com link:",
			pageContent.includes("instagram.com"),
		);

		const instagramSection = page.locator("text=/Instagram/i");
		const instagramLink = page.locator('a[href*="instagram.com"]');

		await expect(instagramSection.first()).toBeVisible();
		await expect(instagramLink.first()).toBeVisible();

		const rel = await instagramLink.first().getAttribute("rel");
		expect(rel).toBe("nofollow noopener");

		const target = await instagramLink.first().getAttribute("target");
		expect(target).toBe("_blank");
	});

	test("Instagram URL未登録店舗ではInstagramリンクが表示されない", async ({
		page,
	}) => {
		await page.goto(`/bars/${barIdWithoutInstagram}`);

		const topTab = page.locator(
			'[role="tab"]:has-text("基本情報"), button:has-text("基本情報"), [data-value="top"]',
		);

		if ((await topTab.count()) > 0) {
			await topTab.first().click();
		}

		await page.waitForTimeout(500);

		const instagramLink = page.locator('a[href*="instagram.com"]');
		await expect(instagramLink).not.toBeVisible();

		const instagramSection = page.locator("text=/Instagram/i");
		await expect(instagramSection).not.toBeVisible();
	});

	test("Instagramリンクには正しいrel属性とtarget属性が設定されている", async ({
		page,
	}) => {
		await page.goto(`/bars/${barIdWithInstagram}`, {
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

		const instagramLink = page.locator('a[href*="instagram.com"]');

		await expect(instagramLink.first()).toBeVisible();

		const rel = await instagramLink.first().getAttribute("rel");
		expect(rel).toBe("nofollow noopener");

		const target = await instagramLink.first().getAttribute("target");
		expect(target).toBe("_blank");
	});
});
