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

	test("?city= の直リンクアクセスで該当市町村の店舗のみ表示され、セレクトにも反映される", async ({
		page,
	}) => {
		// seed.e2e.sql: 100001=静岡市 / 100002=渋谷区
		await page.goto("/?city=静岡市");

		// Issue #419: 以前は SHIZUOKA_CITIES が区付き（例: "静岡市（葵区）"）で、
		// seed の city="静岡市"（区なし）に一致する option が無く value が復元できなかった。
		// マスタを区なしへ統一したので、セレクトへの value 反映も検証する。
		await expect(page.locator("#city")).toHaveValue("静岡市");
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
		await expect(page.getByText("E2Eテストバー東京")).toHaveCount(0);
	});

	test("市町村セレクトで静岡市を選ぶと該当店舗のみ表示される（Issue #419）", async ({
		page,
	}) => {
		await page.goto("/");

		// フィルターの選択肢に区付き表記が残っていないこと（逆戻り防止）。
		// DB アクセス不要な確定的検証なので、絞り込み操作の前に済ませる。
		await expect(
			page.locator("#city option", { hasText: "静岡市（" }),
		).toHaveCount(0);

		// Issue #419 の核心: 政令市を区なしで選べること。選択が bars.city="静岡市" に一致する。
		await page.selectOption("#city", "静岡市");

		// URL 反映（= 絞り込みリクエスト発火）を先に待ってから一覧を検証する。
		// onSearch → router.push は非同期で、待たずに一覧を見ると絞り込み前の状態を拾いうる。
		await expect(page).toHaveURL(
			/city=%E9%9D%99%E5%B2%A1%E5%B8%82|city=静岡市/,
		);
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
		await expect(page.getByText("E2Eテストバー東京")).toHaveCount(0);
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
