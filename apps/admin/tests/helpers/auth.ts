import type { Page } from "@playwright/test";

// Why not: 平文パスワードをコードに含めない。CI/ローカルともに E2E_ADMIN_PASSWORD 経由で渡す。
const E2E_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

/**
 * テストユーザーの認証情報（seed.e2e.sql と同期）
 */
export const TEST_USERS = {
	admin: {
		barManageId: "e2e-admin",
		password: E2E_PASSWORD,
		role: "admin",
		redirectUrl: "/bars",
	},
	barOwner: {
		barManageId: "e2e-bar-owner",
		password: E2E_PASSWORD,
		role: "bar_owner",
		redirectUrl: "/bars/100001",
	},
} as const;

/**
 * ログインヘルパー関数
 */
export async function login(
	page: Page,
	barManageId: string,
	password: string,
	redirectUrl: string,
) {
	await page.goto("/login");
	await page.getByLabel("店舗ID").fill(barManageId);
	await page.getByLabel("パスワード").fill(password);
	await page.getByRole("button", { name: "ログイン" }).click();

	// ログイン後のリダイレクト先まで待機
	await page.waitForURL(redirectUrl);
}

/**
 * 管理者としてログイン
 */
export async function loginAsAdmin(page: Page) {
	await login(
		page,
		TEST_USERS.admin.barManageId,
		TEST_USERS.admin.password,
		TEST_USERS.admin.redirectUrl,
	);
}

/**
 * バーオーナーとしてログイン
 */
export async function loginAsBarOwner(page: Page) {
	await login(
		page,
		TEST_USERS.barOwner.barManageId,
		TEST_USERS.barOwner.password,
		TEST_USERS.barOwner.redirectUrl,
	);
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
