import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("タイムライン（Dark Taproom）", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("投稿を作成するとタイムラインに反映され、いいねが赤の塗りでトグルする", async ({
		page,
	}) => {
		// Why not seed 投稿に依存: タイムラインは「自分＋フォロー中」の投稿を出すため、
		// テスト内で自分の投稿を作れば seed の有無に関わらず1件を確実に用意できる。
		const body = `E2Eタイムライン投稿 ${Date.now()}`;

		// seed.e2e.sql で固定投入される /bars/100001 から投稿導線に入る
		await page.goto("/bars/100001");
		await page.getByRole("link", { name: "このお店に投稿する" }).click();
		await expect(page).toHaveURL(/\/posts\/new\?barId=100001/);

		// 投稿本文を入力して送信（送信後は店舗詳細へ戻る）
		await page.locator('textarea[name="body"]').fill(body);
		await page.getByRole("button", { name: "投稿する" }).click();
		await expect(page).toHaveURL(/\/bars\/100001/);

		// タイムラインへ移動し、Dark Taproom の見出しと自分の投稿が表示される
		await page.goto("/timeline");
		await expect(
			page.getByRole("heading", { name: "タイムライン" }),
		).toBeVisible();
		await expect(page.getByText("フォロー中")).toBeVisible();

		const postCard = page.locator("article", { hasText: body });
		await expect(postCard).toBeVisible();

		// いいねボタン: 初期は未いいね（aria-pressed=false）
		const likeButton = postCard.getByRole("button", { name: "いいね" });
		await expect(likeButton).toHaveAttribute("aria-pressed", "false");

		// 押すと赤の塗り（aria-pressed=true）に変わり、ハートが currentColor で塗られる
		await likeButton.click();
		const likedButton = postCard.getByRole("button", {
			name: "いいねを取り消す",
		});
		await expect(likedButton).toHaveAttribute("aria-pressed", "true");
		await expect(likedButton).toHaveClass(/text-\[#e0483a\]/);
		await expect(likedButton.locator("svg")).toHaveAttribute(
			"fill",
			"currentColor",
		);
	});
});
