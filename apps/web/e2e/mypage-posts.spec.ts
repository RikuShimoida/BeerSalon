import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("マイページ 投稿タブ", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("画像なし投稿タイルが背景と識別できる境界・面色で3列グリッド表示され、店舗詳細へリンクする", async ({
		page,
	}) => {
		// Why not: seed-e2e は smoke-user に投稿を投入しないため、CI の新鮮な DB では
		// 投稿タブが空になり視認性を検証できない。テスト内で画像なし投稿を1件作り、
		// 検証の前提（画像なしタイルが1件以上ある状態）を自前で用意する。
		const body = `E2E画像なし投稿 ${Date.now()}`;
		await page.goto("/posts/new?barId=100001");
		await page.fill('textarea[name="body"]', body);
		await page.getByRole("button", { name: "投稿する" }).click();
		// 投稿完了で店舗詳細へ戻る
		await expect(page).toHaveURL(/\/bars\/100001/, { timeout: 15000 });

		await page.goto("/mypage");

		// 投稿タブ（デフォルト）に作成した画像なしタイルが表示される
		const tile = page.getByRole("link", { name: body }).first();
		await expect(tile).toBeVisible();

		// タイルは店舗詳細へのリンク
		await expect(tile).toHaveAttribute("href", "/bars/100001");

		// Issue #501 の受入条件: 画像なしタイルが背景 (--card) と識別できること。
		// 境界（border-width > 0）と、面色がカード背景と異なることを実測で検証する。
		const styles = await tile.evaluate((el) => {
			const cs = getComputedStyle(el);
			const card = el.closest('[class*="rounded-2xl"]');
			return {
				borderTopWidth: cs.borderTopWidth,
				tileBg: cs.backgroundColor,
				cardBg: card ? getComputedStyle(card).backgroundColor : null,
			};
		});

		// 薄ボーダーが付与され境界が視認できる
		expect(Number.parseFloat(styles.borderTopWidth)).toBeGreaterThan(0);
		// タイル面色がカード背景と異なり、背景に溶けない
		expect(styles.tileBg).not.toBe(styles.cardBg);
	});

	test("3列グリッドで投稿タイルが並ぶ", async ({ page }) => {
		const body = `E2Eグリッド投稿 ${Date.now()}`;
		await page.goto("/posts/new?barId=100001");
		await page.fill('textarea[name="body"]', body);
		await page.getByRole("button", { name: "投稿する" }).click();
		await expect(page).toHaveURL(/\/bars\/100001/, { timeout: 15000 });

		await page.goto("/mypage");

		// 投稿グリッドが grid-cols-3（正方形3列）で構成される
		const grid = page
			.locator('[role="tabpanel"] [class*="grid-cols-3"]')
			.first();
		await expect(grid).toBeVisible();
	});
});
