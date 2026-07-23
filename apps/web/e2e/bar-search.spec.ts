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

		// 絞り込み前の初期状態（両店舗が見える）まで hydration を待つ。
		// これを待たずに selectOption すると、CI では onChange が hydrate 前に空振りし
		// router.push が発火せず URL・一覧とも更新されないことがある。
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
		await expect(page.getByText("E2Eテストバー東京")).toBeVisible();

		// フィルターの選択肢に区付き表記が残っていないこと（逆戻り防止）。
		await expect(
			page.locator("#city option", { hasText: "静岡市（" }),
		).toHaveCount(0);

		// Issue #419 の核心: 政令市を区なしで選べること。選択が bars.city="静岡市" に一致する。
		await page.selectOption("#city", "静岡市");

		// 絞り込み結果（= バグが直っていること）を主検証にする。東京が消えるまで待つ。
		await expect(page.getByText("E2Eテストバー東京")).toHaveCount(0);
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
		// URL への反映も併せて検証（従）。
		await expect(page).toHaveURL(
			/city=%E9%9D%99%E5%B2%A1%E5%B8%82|city=静岡市/,
		);
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

	test("産地フィルターは国見出し付きで、地域がチップとして表示される（Issue #491）", async ({
		page,
	}) => {
		await page.goto("/");

		// 産地セクションの見出し（apps/web/src/components/search/search-form.tsx と同期）
		await expect(page.getByText("Origin", { exact: true })).toBeVisible();
		// 国見出し（例: 日本）と、その配下の地域チップ（ボタン）が描画される。
		// seed の regions マスタに存在する「静岡」「カリフォルニア」で検証する。
		await expect(page.getByText("日本", { exact: true })).toBeVisible();
		await expect(
			page.getByRole("button", { name: "静岡", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "カリフォルニア", exact: true }),
		).toBeVisible();
	});

	test("産地を複数チップ選択すると URL が origin=国/地域 のカンマ区切りで更新される（Issue #491）", async ({
		page,
	}) => {
		await page.goto("/");

		const shizuokaChip = page.getByRole("button", {
			name: "静岡",
			exact: true,
		});
		const californiaChip = page.getByRole("button", {
			name: "カリフォルニア",
			exact: true,
		});

		// hydration 完了を待つため、チップが操作可能になるまで待機する。
		await expect(shizuokaChip).toBeVisible();

		await shizuokaChip.click();
		await expect(page).toHaveURL(
			/origin=(%E6%97%A5%E6%9C%AC%2F%E9%9D%99%E5%B2%A1|日本\/静岡)/,
		);
		await expect(shizuokaChip).toHaveAttribute("aria-pressed", "true");

		await californiaChip.click();
		// 2 産地が OR でカンマ連結される（%2C = カンマ）。
		await expect(page).toHaveURL(/origin=[^&]*(%2C|,)[^&]*/);
		await expect(shizuokaChip).toHaveAttribute("aria-pressed", "true");
		await expect(californiaChip).toHaveAttribute("aria-pressed", "true");
	});

	test("複数産地の直リンクアクセスで両チップが選択状態に復元される（Issue #491）", async ({
		page,
	}) => {
		// URL を真実の源として、両産地の選択状態が復元されることを検証する。
		// これはブラウザバック復元と同一経路（parseSearchParams → チップ反映）。
		await page.goto("/?origin=日本/静岡,アメリカ/カリフォルニア");

		await expect(
			page.getByRole("button", { name: "静岡", exact: true }),
		).toHaveAttribute("aria-pressed", "true");
		await expect(
			page.getByRole("button", { name: "カリフォルニア", exact: true }),
		).toHaveAttribute("aria-pressed", "true");
	});

	test("PC幅ではヒーロー見出しがファーストビュー上部に表示される（Issue #498）", async ({
		page,
	}) => {
		// PC 幅の 2 カラム（左ヒーロー・右検索カード）で、背の高い右カードに
		// 左ヒーローが中央揃えで引きずられ見出しが沈む回帰を防ぐ。
		// 修正前は md:items-center により y≈667px まで沈んでいた。
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto("/");

		// h1 は <br /> を含む2行構成のため、アクセシブル名の空白畳み込みに依存せず
		// レベル指定のみで一意の見出しとして掴む（page-client.tsx の h1 と同期）。
		const heading = page.getByRole("heading", { level: 1 });
		await expect(heading).toBeVisible();
		await expect(heading).toContainText("この街で見つける");

		const box = await heading.boundingBox();
		// box が null（不可視）なら検証不能なので明示的に失敗させる。
		// これにより後続の toBeLessThan が undefined を素通りしない。
		if (box === null) {
			throw new Error("h1 見出しの boundingBox が取得できませんでした");
		}
		// 上寄せ（md:items-start）なら見出しはコンテナ上端付近に来る。
		// 300px は「上部に留まる」と「中央へ沈む(≈667px)」を明確に分ける閾値。
		expect(box.y).toBeLessThan(300);
	});
});
