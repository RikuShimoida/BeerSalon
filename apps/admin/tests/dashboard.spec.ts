import { expect, test } from "@playwright/test";
import { loginAsBarOwner } from "./helpers/auth";

// seed.e2e.sql の Dashboard 集計データと同期した期待値（bar 100001）
// 閲覧=2 / お気に入り=1 / 記事いいね=3 / 投稿=2。bar 100002 のデータは混入しない想定。
const EXPECTED = {
	view: "2",
	favorite: "1",
	articleLike: "3",
	post: "2",
} as const;

test.describe("bar_owner 分析ダッシュボード (#348)", () => {
	test("トップ / で自店の4指標が実値で表示される", async ({ page }) => {
		await loginAsBarOwner(page);
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();

		// 各指標カードは <dt>ラベル</dt><dd>値</dd> 構造。ラベル(dt)直後の dd を xpath で一意に取る。
		const cardValue = (label: string) =>
			page
				.getByRole("term")
				.filter({ hasText: label })
				.locator("xpath=following-sibling::dd[1]");

		await expect(cardValue("店舗ページ閲覧数")).toHaveText(EXPECTED.view);
		await expect(cardValue("お気に入り登録数")).toHaveText(EXPECTED.favorite);
		await expect(cardValue("記事いいね数")).toHaveText(EXPECTED.articleLike);
		await expect(cardValue("タグ付け投稿数")).toHaveText(EXPECTED.post);
	});

	test("サイドナビからダッシュボードへ遷移できる", async ({ page }) => {
		await loginAsBarOwner(page);
		await page.goto("/bars/100001");

		await page.getByRole("link", { name: "ダッシュボード" }).first().click();
		await page.waitForURL("/");

		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();
	});
});
