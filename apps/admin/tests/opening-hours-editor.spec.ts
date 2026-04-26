import { expect, test } from "@playwright/test";

test.describe("Opening Hours Editor", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		await page.fill('input[name="email"]', "owner@example.com");
		await page.fill('input[name="password"]', "password123");
		await page.click('button[type="submit"]');
		await page.waitForURL("/");
	});

	test("should display default time slots for all days on bar creation page", async ({
		page,
	}) => {
		await page.goto("/bars/new");

		const dayNames = [
			"月曜日",
			"火曜日",
			"水曜日",
			"木曜日",
			"金曜日",
			"土曜日",
			"日曜日",
		];

		for (const dayName of dayNames) {
			const dayHeading = page.getByText(dayName, { exact: true });
			await expect(dayHeading).toBeVisible();

			const daySection = dayHeading.locator(
				'xpath=ancestor::div[contains(@class, "border")]',
			);

			const timeInputs = daySection.locator('input[type="time"]');
			await expect(timeInputs.first()).toBeVisible();
			await expect(timeInputs.last()).toBeVisible();

			await expect(timeInputs.first()).toHaveValue("");
			await expect(timeInputs.last()).toHaveValue("");
		}
	});

	test("should preserve input values when accordion is toggled", async ({
		page,
	}) => {
		await page.goto("/bars/new");

		const mondayHeading = page.getByText("月曜日", { exact: true });
		const mondaySection = mondayHeading.locator(
			'xpath=ancestor::div[contains(@class, "border")]',
		);

		const timeInputs = mondaySection.locator('input[type="time"]');
		const openTimeInput = timeInputs.first();
		const closeTimeInput = timeInputs.last();

		await openTimeInput.fill("10:00");
		await closeTimeInput.fill("22:00");

		const toggleButton = mondaySection.locator("button").first();
		await toggleButton.click();

		await page.waitForTimeout(500);

		await toggleButton.click();

		await expect(openTimeInput).toHaveValue("10:00");
		await expect(closeTimeInput).toHaveValue("22:00");
	});

	test("should allow adding multiple time slots for a single day", async ({
		page,
	}) => {
		await page.goto("/bars/new");

		const mondayHeading = page.getByText("月曜日", { exact: true });
		const mondaySection = mondayHeading.locator(
			'xpath=ancestor::div[contains(@class, "border")]',
		);

		const addButton = mondaySection.getByText("+ 時間帯を追加");
		await addButton.click();

		const timeInputs = mondaySection.locator('input[type="time"]');

		await expect(timeInputs).toHaveCount(4);
	});

	test("should validate that both open and close times are filled", async ({
		page,
	}) => {
		await page.goto("/bars/new");

		await page.fill('input[name="name"]', "Test Bar");

		const mondayHeading = page.getByText("月曜日", { exact: true });
		const mondaySection = mondayHeading.locator(
			'xpath=ancestor::div[contains(@class, "border")]',
		);

		const timeInputs = mondaySection.locator('input[type="time"]');
		const openTimeInput = timeInputs.first();

		await openTimeInput.fill("10:00");

		await page.locator('button[type="submit"]').click();

		await expect(page.getByText("終了時刻を入力してください")).toBeVisible();
	});

	test("should mark day as closed and hide time inputs", async ({ page }) => {
		await page.goto("/bars/new");

		const mondayHeading = page.getByText("月曜日", { exact: true });
		const mondaySection = mondayHeading.locator(
			'xpath=ancestor::div[contains(@class, "border")]',
		);

		const closedCheckbox = mondaySection.locator('input[type="checkbox"]');
		await closedCheckbox.check();

		const timeInputs = mondaySection.locator('input[type="time"]');
		await expect(timeInputs).toHaveCount(0);

		await closedCheckbox.uncheck();

		await expect(timeInputs.first()).toBeVisible();
	});
});
