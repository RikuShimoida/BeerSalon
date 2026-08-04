import { expect, test } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
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

	test("投稿が上限を超えると初回20件表示 →「もっと見る」で続きが追加表示される", async ({
		page,
	}) => {
		// スモークユーザーの投稿を上限(20)+3 件だけ直接投入し、ページングを確実に発火させる。
		const smokeProfile = await prisma.userProfile.findFirst({
			where: { nickname: "smoke-user" },
			select: { id: true },
		});
		if (!smokeProfile) {
			throw new Error("smoke-user の user_profiles が見つかりません");
		}

		const marker = `pager-${Date.now()}`;
		const totalPosts = 23; // 20 + 3（2ページ目に確実に残る件数）
		const barId = 100001n; // seed.e2e.sql で固定投入される店舗
		try {
			for (let i = 0; i < totalPosts; i++) {
				await prisma.post.create({
					data: {
						userId: smokeProfile.id,
						barId,
						body: `${marker}-${String(i).padStart(2, "0")}`,
						createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
					},
				});
			}

			await page.goto("/timeline");
			await expect(
				page.getByRole("heading", { name: "タイムライン" }),
			).toBeVisible();

			// 初回は上限(20)件までしか出ない = このマーカー投稿は初回に20件表示される。
			const markerCards = page.locator("article", { hasText: marker });
			await expect(markerCards).toHaveCount(20);

			// 「もっと見る」で続きを読み込むと、残り3件が追加されて全23件になる。
			const loadMore = page.getByRole("button", { name: "もっと見る" });
			await expect(loadMore).toBeVisible();
			await loadMore.click();

			await expect(markerCards).toHaveCount(totalPosts);

			// 全件読み込んだら「もっと見る」は消える（続きなし）。
			await expect(loadMore).toHaveCount(0);
		} finally {
			await prisma.post.deleteMany({ where: { body: { startsWith: marker } } });
		}
	});
});
