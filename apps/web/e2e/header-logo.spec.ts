import { expect, test } from "@playwright/test";
import { createAuthenticatedUser } from "./helpers/auth";

test.describe("共通ヘッダーロゴ（Dark Taproom 案A）", () => {
	test.beforeEach(async ({ page }) => {
		await createAuthenticatedUser(page);
	});

	test("ヘッダー左上に新ロゴ(案A)が表示され、クリックでトップへ遷移する", async ({
		page,
	}) => {
		// ヘッダーが描画される認証後ページから確認する
		await page.goto("/timeline");

		const logo = page.getByAltText("Beer Salon");
		await expect(logo).toBeVisible();

		// 新アセット beer-salon-logo-a.svg を指しており、旧ロゴを参照していない
		await expect(logo).toHaveAttribute("src", /beer-salon-logo-a\.svg/);

		// ロゴのリンクはトップページ / を指す（aria-label でヘッダーのホームリンクを特定）
		const homeLink = page.getByRole("link", { name: "Beer Salon ホーム" });
		await expect(homeLink).toHaveAttribute("href", "/");

		// ヘッダー高さ h-16(64px) 内にロゴが収まる（見切れ・はみ出しがない）
		const box = await logo.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.height).toBeLessThanOrEqual(64);
		}

		// クリックでトップページへ遷移する
		await homeLink.click();
		await expect(page).toHaveURL("http://localhost:3000/");
	});

	test("favicon(app/icon.svg)が配信されアクセス可能である", async ({
		page,
	}) => {
		// Next.js App Router 規約の app/icon.svg は /icon.svg で配信される
		const response = await page.request.get("/icon.svg");
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("image/svg+xml");
	});
});
