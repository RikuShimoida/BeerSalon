import { expect, test } from "@playwright/test";
import {
	SLIDE_DURATION_MS,
	SLIDE_TRANSITION_MS,
} from "../src/components/bar/hero-slider";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("店舗詳細ページ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("店舗詳細ページにアクセスすると店舗名とお気に入りボタンが表示される", async ({
		page,
	}) => {
		// Why not: /bars/1 はローカルで開発用 seed が投入されていれば存在するが、
		// CI では seed.e2e.sql のみを投入するため id=1 のバーは存在せず 404 になる。
		// seed.e2e.sql で固定投入される /bars/100001 (E2Eテストバー静岡) を使う。
		await page.goto("/bars/100001");

		const barName = page.locator("h1");
		await expect(barName).toBeVisible();

		const favoriteButton = page.locator(
			'button:has-text("お気に入り"), button[aria-label*="お気に入り"], [data-testid="favorite-button"]',
		);
		const hasFavoriteButton = (await favoriteButton.count()) > 0;
		expect(hasFavoriteButton).toBe(true);
	});

	test("緯度経度が未登録の店舗では、住所ベースの経路案内リンクが表示される", async ({
		page,
	}) => {
		// 100001 は seed.e2e.sql で緯度経度 NULL のため、住所文字列フォールバックを検証する。
		await page.goto("/bars/100001");

		// Why not: dev サーバーのオンデマンドコンパイルにより基本情報タブの初回描画が
		// 遅れることがあるため、住所見出しの表示を待ってから導線リンクを検証する。
		await expect(
			page.getByRole("heading", { name: "住所", exact: true }),
		).toBeVisible();

		const encodedAddress = encodeURIComponent("静岡県静岡市テスト住所1-1-1");

		const appleLink = page.getByRole("link", {
			name: "マップで開く",
			exact: true,
		});
		await expect(appleLink).toBeVisible();
		await expect(appleLink).toHaveAttribute(
			"href",
			`https://maps.apple.com/?daddr=${encodedAddress}`,
		);

		const googleLink = page.getByRole("link", { name: "Googleマップで開く" });
		await expect(googleLink).toBeVisible();
		await expect(googleLink).toHaveAttribute(
			"href",
			`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
		);
	});

	test("緯度経度が登録済みの店舗では、座標ベースの経路案内リンクが表示される", async ({
		page,
	}) => {
		// 100002 は seed.e2e.sql で座標 (35.6595, 139.7005) を投入済み。座標優先を検証する。
		await page.goto("/bars/100002");

		// Why not: dev サーバーのオンデマンドコンパイルにより基本情報タブの初回描画が
		// 遅れることがあるため、住所見出しの表示を待ってから導線リンクを検証する。
		await expect(
			page.getByRole("heading", { name: "住所", exact: true }),
		).toBeVisible();

		const appleLink = page.getByRole("link", {
			name: "マップで開く",
			exact: true,
		});
		await expect(appleLink).toBeVisible();
		await expect(appleLink).toHaveAttribute(
			"href",
			"https://maps.apple.com/?daddr=35.6595%2C139.7005",
		);

		const googleLink = page.getByRole("link", { name: "Googleマップで開く" });
		await expect(googleLink).toBeVisible();
		await expect(googleLink).toHaveAttribute(
			"href",
			"https://www.google.com/maps/dir/?api=1&destination=35.6595%2C139.7005",
		);

		// 経路案内リンクは新規タブで開く
		await expect(appleLink).toHaveAttribute("target", "_blank");
		await expect(googleLink).toHaveAttribute("target", "_blank");
	});

	test.describe("タブナビのスクロールアフォーダンス (#500)", () => {
		// Why not: 100002 はヒーロースライダー（動画+画像のオートスライド）が常時再描画され、
		// evaluate の poll がフレーク要因になる。タブ 6 種は店舗に依らず固定描画されるため、
		// スライダーの軽い 100001 でフェードの出し分けを検証する。
		const fadeOpacity = (side: "left" | "right") =>
			`(() => {
				const fade = document.querySelector(
					'[data-testid="bar-tabs"] > [aria-hidden="true"].${side}-0',
				);
				return fade ? Number(getComputedStyle(fade).opacity) : -1;
			})()`;

		test("モバイル幅で初期は右フェードのみ表示され、右端までスクロールすると左フェードのみ表示される", async ({
			page,
		}) => {
			await page.setViewportSize({ width: 375, height: 812 });
			await page.goto("/bars/100001");

			const tabsNav = page.locator('[data-testid="bar-tabs"] nav');
			await expect(tabsNav).toBeVisible();

			// タブ列が画面幅を超えて横スクロール可能であること（アフォーダンス改善の前提）
			const scroller = page.locator('[data-testid="bar-tabs-scroller"]');
			const isScrollable = await scroller.evaluate(
				(el) => el.scrollWidth > el.clientWidth,
			);
			expect(isScrollable).toBe(true);

			// 初期（先頭）: 右に続きがあるので右フェード表示、左は戻れないので非表示。
			// Why not: transition-opacity の中間値でフレークしないよう厳密一致ではなく
			// 表示側 > 0.9 / 非表示側 < 0.1 の閾値で判定し、遷移完了を poll で待つ。
			await expect
				.poll(async () => page.evaluate(fadeOpacity("right")))
				.toBeGreaterThan(0.9);
			await expect
				.poll(async () => page.evaluate(fadeOpacity("left")))
				.toBeLessThan(0.1);

			// 右端までスクロール
			await scroller.evaluate((el) => {
				el.scrollLeft = el.scrollWidth;
			});

			// 右端: 左に戻れるので左フェード表示、右は終端なので非表示
			await expect
				.poll(async () => page.evaluate(fadeOpacity("left")))
				.toBeGreaterThan(0.9);
			await expect
				.poll(async () => page.evaluate(fadeOpacity("right")))
				.toBeLessThan(0.1);
		});

		test("フェードを追加してもタブ切替は従来どおり動作する（デグレなし）", async ({
			page,
		}) => {
			await page.setViewportSize({ width: 375, height: 812 });
			await page.goto("/bars/100001");

			const menuTab = page.getByRole("button", { name: "メニュー" });
			await expect(menuTab).toBeVisible();
			await menuTab.click();
			await expect(menuTab).toHaveAttribute("aria-current", "page");
		});
	});

	test.describe("ヒーロースライダー (#485)", () => {
		// seed.e2e.sql が bar 100002 に 動画1 + 画像2 のスライダーメディアを投入する前提。
		// Why not: bar 100001 は admin の slider regression テスト (#318) が「slider 0枚から
		// 埋める」前提で使うため、alt を持たない video を混ぜると衝突する。100002 を使う。
		const SLIDER_BAR_PATH = "/bars/100002";
		const activeIndex = () =>
			// opacity=1 の層のインデックス = 現在表示中のメディア。フェード遷移中は -1。
			`(() => {
				const hero = document.querySelector('[data-testid="bar-hero"]');
				const medias = Array.from(hero.querySelectorAll('video, img'));
				return medias.findIndex((m) => {
					const w = m.closest('div.absolute.inset-0');
					return w && getComputedStyle(w).opacity === '1';
				});
			})()`;

		test("動画が muted / playsInline で描画され、全メディアが重ね描画される", async ({
			page,
		}) => {
			await page.goto(SLIDER_BAR_PATH);
			await expect(page.locator("h1")).toBeVisible();

			const hero = page.getByTestId("bar-hero");
			const video = hero.locator("video").first();
			await expect(video).toHaveJSProperty("muted", true);
			await expect(video).toHaveJSProperty("playsInline", true);

			// 動画1 + 画像2 = 3枚が重ね描画される
			const mediaCount = await hero.locator("video, img").count();
			expect(mediaCount).toBe(3);
		});

		test("メディアが2件以上のときドットが表示され、オートスライドで自動遷移する", async ({
			page,
		}) => {
			await page.goto(SLIDER_BAR_PATH);
			await expect(page.locator("h1")).toBeVisible();

			const dots = page.locator('[aria-label^="画像"][aria-label$="を表示"]');
			await expect(dots).toHaveCount(3);

			const before = await page.evaluate(activeIndex());
			// 表示時間(5秒) + フェード遷移 + 描画マージン を跨ぐまで待つ。
			// マジックナンバーを避け hero-slider.ts の定数から算出する。
			await page.waitForTimeout(SLIDE_DURATION_MS + SLIDE_TRANSITION_MS + 800);
			const after = await page.evaluate(activeIndex());
			expect(after).not.toBe(before);
		});

		test("ドットを手動タップすると該当メディアへ切り替わる", async ({
			page,
		}) => {
			await page.goto(SLIDER_BAR_PATH);
			await expect(page.locator("h1")).toBeVisible();

			// 2番目のドット(index=1)をタップ
			await page.locator('button[aria-label="画像2を表示"]').click();
			// クリック直後はフェード遷移中(-1)を挟むため、遷移完了を待って index=1 を確認
			await expect
				.poll(async () => page.evaluate(activeIndex()), { timeout: 3000 })
				.toBe(1);
		});
	});

	test.describe("基本情報タブのPC 2カラムレイアウト (#499)", () => {
		test("PC 幅では左カラム(About)と右カラム(営業時間)が横並びになる", async ({
			page,
		}) => {
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.goto("/bars/100001");

			const about = page.getByRole("heading", { name: "About", exact: true });
			const openingHours = page.getByRole("heading", {
				name: "営業時間",
				exact: true,
			});
			await expect(about).toBeVisible();
			await expect(openingHours).toBeVisible();

			const aboutBox = await about.boundingBox();
			const openingBox = await openingHours.boundingBox();
			if (!aboutBox || !openingBox) {
				throw new Error("見出しの bounding box が取得できませんでした");
			}

			// 横並び = 右カラム(営業時間)が左カラム(About)より右にあり、
			// かつ縦位置が概ね揃う(縦積みなら営業時間は About より大きく下へ回る)。
			expect(openingBox.x).toBeGreaterThan(aboutBox.x);
			expect(Math.abs(openingBox.y - aboutBox.y)).toBeLessThan(200);

			// 右カラムは約300px 幅に収まり、全幅(1200px超)に間延びしない。
			const openingCard = page
				.locator("section", { has: openingHours })
				.first();
			const cardBox = await openingCard.boundingBox();
			if (!cardBox) {
				throw new Error("営業時間カードの bounding box が取得できませんでした");
			}
			expect(cardBox.width).toBeLessThan(360);
		});

		test("モバイル幅では左カラム(About)の下に右カラム(営業時間)が縦積みされる", async ({
			page,
		}) => {
			await page.setViewportSize({ width: 375, height: 812 });
			await page.goto("/bars/100001");

			const about = page.getByRole("heading", { name: "About", exact: true });
			const openingHours = page.getByRole("heading", {
				name: "営業時間",
				exact: true,
			});
			await expect(about).toBeVisible();
			await expect(openingHours).toBeVisible();

			const aboutBox = await about.boundingBox();
			const openingBox = await openingHours.boundingBox();
			if (!aboutBox || !openingBox) {
				throw new Error("見出しの bounding box が取得できませんでした");
			}

			// 縦積み = 営業時間が About より下に配置される(横並びではない)。
			expect(openingBox.y).toBeGreaterThan(aboutBox.y);
		});
	});
});
