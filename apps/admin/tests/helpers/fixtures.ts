import { test as base, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsBarOwner } from "./auth";

/**
 * カスタムフィクスチャの型定義
 */
type CustomFixtures = {
	authenticatedPage: Page;
	adminPage: Page;
	barOwnerPage: Page;
};

/**
 * 認証済みページのフィクスチャ
 */
export const test = base.extend<CustomFixtures>({
	/**
	 * 一般的な認証済みページ（バーオーナー）
	 */
	authenticatedPage: async ({ page }, use) => {
		await loginAsBarOwner(page);
		await use(page);
	},

	/**
	 * 管理者として認証済みのページ
	 */
	adminPage: async ({ page }, use) => {
		await loginAsAdmin(page);
		await use(page);
	},

	/**
	 * バーオーナーとして認証済みのページ
	 */
	barOwnerPage: async ({ page }, use) => {
		await loginAsBarOwner(page);
		await use(page);
	},
});

export { expect } from "@playwright/test";
