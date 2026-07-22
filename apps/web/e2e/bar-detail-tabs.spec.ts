import { expect, test } from "@playwright/test";
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

	test.describe("ヒーロースライダー (#485)", () => {
		// seed.e2e.sql が bar 100001 に 動画1 + 画像2 のスライダーメディアを投入する前提。
		const activeIndex = () =>
			// opacity=1 の層のインデックス = 現在表示中のメディア。フェード遷移中は -1。
			`(() => {
				const hero = document.querySelector('[class*="42vh"]');
				const medias = Array.from(hero.querySelectorAll('video, img'));
				return medias.findIndex((m) => {
					const w = m.closest('div.absolute.inset-0');
					return w && getComputedStyle(w).opacity === '1';
				});
			})()`;

		test("動画が muted / playsInline で描画され、全メディアが重ね描画される", async ({
			page,
		}) => {
			await page.goto("/bars/100001");
			await expect(page.locator("h1")).toBeVisible();

			const video = page.locator('[class*="42vh"] video').first();
			await expect(video).toHaveJSProperty("muted", true);
			await expect(video).toHaveJSProperty("playsInline", true);

			// 動画1 + 画像2 = 3枚が重ね描画される
			const mediaCount = await page
				.locator('[class*="42vh"] video, [class*="42vh"] img')
				.count();
			expect(mediaCount).toBe(3);
		});

		test("メディアが2件以上のときドットが表示され、オートスライドで自動遷移する", async ({
			page,
		}) => {
			await page.goto("/bars/100001");
			await expect(page.locator("h1")).toBeVisible();

			const dots = page.locator('[aria-label^="画像"][aria-label$="を表示"]');
			await expect(dots).toHaveCount(3);

			const before = await page.evaluate(activeIndex());
			// 5秒の表示 + フェード遷移を跨ぐため十分待つ
			await page.waitForTimeout(6500);
			const after = await page.evaluate(activeIndex());
			expect(after).not.toBe(before);
		});

		test("ドットを手動タップすると該当メディアへ切り替わる", async ({
			page,
		}) => {
			await page.goto("/bars/100001");
			await expect(page.locator("h1")).toBeVisible();

			// 2番目のドット(index=1)をタップ
			await page.locator('button[aria-label="画像2を表示"]').click();
			// クリック直後はフェード遷移中(-1)を挟むため、遷移完了を待って index=1 を確認
			await expect
				.poll(async () => page.evaluate(activeIndex()), { timeout: 3000 })
				.toBe(1);
		});
	});
});
