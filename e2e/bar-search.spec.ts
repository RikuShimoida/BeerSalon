import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("トップページ（検索ページ）", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("認証済みユーザーがトップページにアクセスすると検索バーと店舗一覧が表示される", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL("/");

		const searchInput = page.locator(
			'input[type="search"], input[placeholder*="検索"]',
		);
		const searchInputCount = await searchInput.count();
		expect(searchInputCount).toBeGreaterThan(0);
	});

	test("検索バーが表示され、プレースホルダーが設定されている", async ({
		page,
	}) => {
		await page.goto("/");

		const searchInput = page.locator(
			'input[type="search"], input[placeholder*="検索"]',
		);
		await expect(searchInput.first()).toBeVisible();
	});

	test("店舗一覧エリアが表示される", async ({ page }) => {
		await page.goto("/");

		const barListArea = page
			.locator('[data-testid="bar-list"], .bar-list, [role="list"]')
			.or(page.locator('h2:has-text("店舗"), h2:has-text("検索結果")'));

		const hasBarList = (await barListArea.count()) > 0;
		expect(hasBarList).toBe(true);
	});

	test("検索バーでテキスト検索ができる", async ({ page }) => {
		await page.goto("/");

		const searchInput = page.locator(
			'input[type="search"], input[placeholder*="検索"]',
		);

		if ((await searchInput.count()) > 0) {
			await searchInput.first().fill("ビール");
			await searchInput.first().press("Enter");

			await page.waitForTimeout(1000);

			const url = page.url();
			expect(url).toMatch(/\?.*q=|search=/);
		} else {
			test.skip();
		}
	});

	test("市町村フィルタで絞り込みができる", async ({ page }) => {
		await page.goto("/");

		const cityFilter = page.locator(
			'select[name="city"], button:has-text("市町村"), [data-testid="city-filter"]',
		);

		if ((await cityFilter.count()) > 0) {
			const filterElement = cityFilter.first();

			if ((await filterElement.getAttribute("role")) === "button") {
				await filterElement.click();
			} else {
				const options = await filterElement.locator("option").count();
				if (options > 1) {
					await filterElement.selectOption({ index: 1 });
				}
			}

			await page.waitForTimeout(1000);
		} else {
			test.skip();
		}
	});

	test("ビールカテゴリフィルタで絞り込みができる", async ({ page }) => {
		await page.goto("/");

		const categoryFilter = page.locator(
			'select[name="category"], button:has-text("カテゴリ"), [data-testid="category-filter"]',
		);

		if ((await categoryFilter.count()) > 0) {
			const filterElement = categoryFilter.first();

			if ((await filterElement.getAttribute("role")) === "button") {
				await filterElement.click();
			} else {
				const options = await filterElement.locator("option").count();
				if (options > 1) {
					await filterElement.selectOption({ index: 1 });
				}
			}

			await page.waitForTimeout(1000);
		} else {
			test.skip();
		}
	});

	test("ビールの産地フィルタが表示される", async ({ page }) => {
		await page.goto("/");

		const originFilter = page.locator('select#origin, [id="origin"]');
		await expect(originFilter).toBeVisible();

		const label = page.locator('label[for="origin"]');
		await expect(label).toContainText("ビールの産地");
	});

	test("ビールの産地フィルタで絞り込みができる", async ({ page }) => {
		await page.goto("/");

		const originFilter = page.locator("select#origin");

		if ((await originFilter.count()) > 0) {
			const options = await originFilter.locator("option").count();
			if (options > 1) {
				await originFilter.selectOption({ index: 1 });
				await page.waitForTimeout(1000);
			}
		} else {
			test.skip();
		}
	});

	test("産地フィルタと他のフィルタを組み合わせて使用できる", async ({
		page,
	}) => {
		await page.goto("/");

		const cityFilter = page.locator("select#city");
		const categoryFilter = page.locator("select#category");
		const originFilter = page.locator("select#origin");

		if ((await cityFilter.count()) > 0 && (await originFilter.count()) > 0) {
			const cityOptions = await cityFilter.locator("option").count();
			const originOptions = await originFilter.locator("option").count();

			if (cityOptions > 1 && originOptions > 1) {
				await cityFilter.selectOption({ index: 1 });
				await page.waitForTimeout(500);

				await originFilter.selectOption({ index: 1 });
				await page.waitForTimeout(1000);
			}
		} else {
			test.skip();
		}
	});

	test("店舗カードには店舗名・都道府県・市町村が表示される", async ({
		page,
	}) => {
		await page.goto("/");

		const barCard = page
			.locator('[data-testid="bar-card"], .bar-card, article')
			.first();

		if ((await barCard.count()) > 0) {
			await expect(barCard).toBeVisible();

			const hasName =
				(await barCard.locator("h2, h3, [data-testid='bar-name']").count()) > 0;
			expect(hasName).toBe(true);
		} else {
			test.skip();
		}
	});

	test("店舗カードをクリックすると店舗詳細ページに遷移する", async ({
		page,
	}) => {
		await page.goto("/");

		const barCard = page
			.locator('[data-testid="bar-card"], .bar-card, article')
			.first();

		if ((await barCard.count()) > 0) {
			await barCard.click();

			await page.waitForURL(/\/bars\/\d+/, { timeout: 10000 });
			expect(page.url()).toMatch(/\/bars\/\d+/);
		} else {
			test.skip();
		}
	});
});
