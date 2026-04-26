import type { Page } from "@playwright/test";

/**
 * テストユーザーの認証情報
 */
export const TEST_USERS = {
	admin: {
		email: "admin@example.com",
		password: "password123",
		role: "admin",
	},
	barOwner: {
		email: "owner@example.com",
		password: "password123",
		role: "bar_owner",
	},
} as const;

/**
 * ログインヘルパー関数
 */
export async function login(
	page: Page,
	email: string = TEST_USERS.barOwner.email,
	password: string = TEST_USERS.barOwner.password,
) {
	await page.goto("/login");
	await page.getByLabel("メールアドレス").fill(email);
	await page.getByLabel("パスワード").fill(password);
	await page.getByRole("button", { name: "ログイン" }).click();

	// ダッシュボードに遷移するまで待機
	await page.waitForURL("/");
}

/**
 * 管理者としてログイン
 */
export async function loginAsAdmin(page: Page) {
	await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
}

/**
 * バーオーナーとしてログイン
 */
export async function loginAsBarOwner(page: Page) {
	await login(page, TEST_USERS.barOwner.email, TEST_USERS.barOwner.password);
}

/**
 * ログアウトヘルパー関数
 */
export async function logout(page: Page) {
	await page.getByRole("button", { name: "ログアウト" }).click();
	await page.waitForURL("/login");
}

/**
 * 認証トークンを取得
 */
export async function getAuthToken(page: Page): Promise<string | undefined> {
	const cookies = await page.context().cookies();
	const adminToken = cookies.find((cookie) => cookie.name === "admin-token");
	return adminToken?.value;
}

/**
 * 認証されているかチェック
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
	const token = await getAuthToken(page);
	return !!token;
}
