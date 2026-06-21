import { expect, test } from "@playwright/test";
import { loginAsSmokeUser } from "./helpers/auth";

test.describe("トップページ（検索ページ）", () => {
	test.beforeEach(async ({ page }) => {
		// Why not: 旧版ではテスト題名の @smoke 判定で beforeEach の処理を切り替えていたが、
		//          @smoke タグ廃止に伴い不要となったため、seed 済みユーザーで直接ログインに統一する。
		await loginAsSmokeUser(page);
	});

	test("店舗一覧エリアが表示される", async ({ page }) => {
		await page.goto("/");

		// 店舗一覧コンポーネントの見出し（apps/web/src/components/bar/bar-list.tsx と同期）
		const barListHeading = page.getByRole("heading", { name: "近くのお店" });
		await expect(barListHeading).toBeVisible();
	});

	test("?city= の直リンクアクセスで該当市町村の店舗のみ表示される", async ({
		page,
	}) => {
		// seed.e2e.sql: 100001=静岡市 / 100002=渋谷区
		await page.goto("/?city=静岡市");

		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
		await expect(page.getByText("E2Eテストバー東京")).toHaveCount(0);

		// 検索フォームの市町村セレクトに直リンクの値が復元されていること
		await expect(page.locator("#city")).toHaveValue("静岡市");
	});

	test("フリーワード検索で一覧が更新され URL に ?q= が反映される", async ({
		page,
	}) => {
		await page.goto("/");

		await page.fill("#search-keyword", "東京");
		await page.getByRole("button", { name: "検索" }).click();

		await expect(page).toHaveURL(/\?q=%E6%9D%B1%E4%BA%AC|\?q=東京/);
		await expect(page.getByText("E2Eテストバー東京")).toBeVisible();
		await expect(page.getByText("E2Eテストバー静岡")).toHaveCount(0);
	});

	test("ブラウザバックで検索条件が復元される", async ({ page }) => {
		await page.goto("/");

		await page.fill("#search-keyword", "静岡");
		await page.getByRole("button", { name: "検索" }).click();
		await expect(page).toHaveURL(/\?q=/);
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();

		// city 絞り込みで別状態へ遷移してから戻る
		await page.goto("/?city=渋谷区");
		await expect(page.getByText("E2Eテストバー東京")).toBeVisible();

		await page.goBack();

		await expect(page).toHaveURL(/\?q=/);
		await expect(page.locator("#search-keyword")).toHaveValue("静岡");
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
	});
});
