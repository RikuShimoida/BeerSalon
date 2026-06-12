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

// Why not: prisma/seed-e2e.ts で投入済みの固定ユーザー (E2E_TEST_USER_PROFILE) と
// 値を一致させる必要があるため、ヘルパー側にも同じ定数として持つ。
const SMOKE_USER_EMAIL = "smoke-user@example.test";

const SMOKE_USER_PROFILE: Omit<TestUser, "email" | "password"> = {
	lastName: "スモーク",
	firstName: "テスト",
	nickname: "smoke-user",
	year: "1990",
	month: "1",
	day: "1",
	gender: "male",
	prefecture: "東京都",
};

export async function loginAsSmokeUser(page: Page) {
	const password = process.env.E2E_TEST_USER_PASSWORD;
	if (!password) {
		throw new Error("E2E_TEST_USER_PASSWORD is not set");
	}

	await page.goto("/login");
	await fillLoginForm(page, SMOKE_USER_EMAIL, password);

	// Why not: 単純な waitForURL("/") は middleware が /signup/profile に
	// リダイレクトしたケース（user_profiles 取得失敗）を検知できず、
	// 後続テストが空のページに対して操作してタイムアウトするため、
	// 「/ への到達」と「/signup/profile に飛ばされていないこと」を両方検証する。
	await page.waitForURL("/", { timeout: 15000 });
	const currentUrl = new URL(page.url());
	if (currentUrl.pathname !== "/") {
		throw new Error(
			`loginAsSmokeUser: expected to land on "/" but got "${currentUrl.pathname}". ` +
				"middleware may have redirected to /signup/profile because user_profiles was not found. " +
				"Verify that seed-e2e.ts created the user_profiles row for the smoke user.",
		);
	}
}

// Why not: UI 経由のサインアップ完走 (/signup → /signup/profile → /signup/confirm → /) は
// ローカル Supabase のセッション継承が不安定で beforeEach が 10 秒タイムアウトする。
// seed-e2e.ts で投入済みのスモークユーザーで直接ログインする方式に統一する。
export async function createAuthenticatedUser(page: Page): Promise<TestUser> {
	const password = process.env.E2E_TEST_USER_PASSWORD;
	if (!password) {
		throw new Error("E2E_TEST_USER_PASSWORD is not set");
	}

	await loginAsSmokeUser(page);

	return {
		email: SMOKE_USER_EMAIL,
		password,
		...SMOKE_USER_PROFILE,
	};
}
