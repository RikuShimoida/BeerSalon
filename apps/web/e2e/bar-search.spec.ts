import { expect, test } from "@playwright/test";
import { loginAsSmokeUser } from "./helpers/auth";
import { createBarWithGeo, removeBarWithGeo } from "./helpers/database";

// Why not: 「市町村を選ぶと〜ピン表示」テストは共有 DB に一時 bar を作成/削除する。
// fullyParallel のまま同ファイルの検索/件数系テストと並列に走らせると、一時 bar が
// 他テストの `/` 一覧に混ざり非決定的に失敗する。同ファイル内を直列化して分離する
// （CI は workers:1 で元々直列。ローカル並列でも安定させるための措置）。
test.describe.configure({ mode: "serial" });

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

		// Why not: #city セレクトの value 復元は検証しない。SHIZUOKA_CITIES は区まで含む
		// 粒度（例: "静岡市（葵区）"）で、seed の city="静岡市"（区なし）に一致する option が
		// 存在せず value が反映されないため。URL→ステート→一覧反映という本質は一覧の絞り込みで担保する。
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

	test("市町村を選ぶと、その市町村の DB 登録店舗がマップにピン表示され、ピンから店舗詳細へ遷移できる", async ({
		page,
	}) => {
		// seed を書き換えず、CITY_COORDINATES に一致する city と座標を持つ専用 bar を作る
		const { barId, name, city } = await createBarWithGeo();

		try {
			await page.goto(`/?city=${encodeURIComponent(city)}`);

			// Why not: AdvancedMarker は Google Maps 内部の Web Component として描画される。
			// title=店舗名 の gmp-advanced-marker が出現することで「DB 店舗がピン化された」ことを検証する。
			const marker = page.locator(`gmp-advanced-marker[title="${name}"]`);
			await expect(marker).toBeVisible({ timeout: 20000 });

			// ピンを実クリック（合成イベントでは Google Maps の onClick が発火しないため座標クリック）。
			// アンカーは下端のため視覚中心のやや上を押す。
			const box = await marker.boundingBox();
			if (!box) throw new Error("marker bounding box not found");
			await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 - 8);

			// InfoWindow の「店舗詳細を見る」導線が出て、押下で /bars/[barId] へ遷移する
			const detailLink = page.locator(`.gm-style-iw a[href="/bars/${barId}"]`);
			await expect(detailLink).toBeVisible();
			await detailLink.click();
			await expect(page).toHaveURL(new RegExp(`/bars/${barId}$`));
		} finally {
			await removeBarWithGeo();
		}
	});
});
