import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";

export interface TestUser {
	email: string;
	password: string;
	lastName: string;
	firstName: string;
	nickname: string;
	year: string;
	month: string;
	day: string;
	gender: string;
	prefecture: string;
}

export function generateTestUser(): TestUser {
	const currentYear = new Date().getFullYear();
	const birthYear = faker.number.int({
		min: currentYear - 60,
		max: currentYear - 20,
	});

	return {
		email: faker.internet.email(),
		password: "Test1234!@#",
		lastName: faker.person.lastName(),
		firstName: faker.person.firstName(),
		nickname: faker.internet.username(),
		year: birthYear.toString(),
		month: faker.number.int({ min: 1, max: 12 }).toString(),
		day: faker.number.int({ min: 1, max: 28 }).toString(),
		gender: "male",
		prefecture: "東京都",
	};
}

export async function fillSignUpForm(page: Page, user: TestUser) {
	await page.fill('input[name="email"]', user.email);
	await page.fill('input[name="password"]', user.password);
	await page.click('button[type="submit"]');
}

export async function fillLoginForm(
	page: Page,
	email: string,
	password: string,
) {
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
}

export async function fillProfileForm(page: Page, user: TestUser) {
	await page.fill('input[name="lastName"]', user.lastName);
	await page.fill('input[name="firstName"]', user.firstName);
	await page.fill('input[name="nickname"]', user.nickname);
	await page.selectOption('select[name="year"]', user.year);
	await page.selectOption('select[name="month"]', user.month);
	await page.selectOption('select[name="day"]', user.day);
	await page.selectOption('select[name="gender"]', user.gender);
	await page.selectOption('select[name="prefecture"]', user.prefecture);
	await page.click('button[type="submit"]');
}

export async function createAuthenticatedUser(page: Page): Promise<TestUser> {
	const user = generateTestUser();

	await page.goto("/signup");
	await fillSignUpForm(page, user);
	await page.waitForURL(/\/signup\?success=true/, { timeout: 15000 });

	await page.goto("/signup/profile");
	await page.waitForURL(/\/signup\/profile/, { timeout: 15000 });

	await fillProfileForm(page, user);
	await page.waitForURL(/\/signup\/confirm/, { timeout: 15000 });

	const confirmButton = page.locator('button:has-text("この内容で登録する")');
	await confirmButton.click();
	await page.waitForURL("/", { timeout: 15000 });

	return user;
}
