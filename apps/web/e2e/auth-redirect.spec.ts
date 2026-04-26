import { expect, test } from "@playwright/test";

test.describe("認証リダイレクト", () => {
	test("未認証でトップページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証で店舗詳細ページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/bars/1");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証でマイページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/mypage");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証でタイムラインページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/timeline");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証でお気に入りバーページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/favorites/bars");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証で投稿作成ページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/posts/new");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証で通知ページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/notifications");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});

	test("未認証で閲覧履歴ページにアクセスするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/history/bars");

		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});
});
