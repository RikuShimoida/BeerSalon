import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// セルフサーブ登録（未ログインの店舗オーナーが申し込む公開フロー）の受入条件を検証する。
test.describe("店舗セルフサーブ登録", () => {
	test("ログイン画面から登録画面へ遷移でき、フォーム項目が表示される", async ({
		page,
	}) => {
		await page.goto("/login");

		await page.getByRole("link", { name: "店舗登録はこちら" }).click();

		await expect(page).toHaveURL(/\/bars\/register$/);
		await expect(
			page.getByRole("heading", { name: "Beer Salon Admin" }),
		).toBeVisible();
		await expect(page.getByText("店舗登録の申し込み")).toBeVisible();

		await expect(page.getByLabel("店舗ID")).toBeVisible();
		await expect(page.getByLabel("パスワード")).toBeVisible();
		await expect(page.getByLabel("管理者メールアドレス")).toBeVisible();
		await expect(page.getByLabel("管理者電話番号")).toBeVisible();
	});

	test("申し込むと審査中の完了画面が表示される", async ({ page }) => {
		// 再実行で bar_manage_id が衝突しないよう、テスト実行ごとに一意なスラッグを使う。
		const uniqueId = `e2e-selfserve-${Date.now()}`;

		await page.goto("/bars/register");

		await page.getByLabel("店舗ID").fill(uniqueId);
		await page.getByLabel("パスワード").fill("password123");
		await page.getByLabel("管理者メールアドレス").fill("owner@example.com");
		await page.getByLabel("管理者電話番号").fill("09012345678");

		await page.getByRole("button", { name: "登録を申し込む" }).click();

		await expect(
			page.getByRole("heading", { name: "お申し込みを受け付けました" }),
		).toBeVisible();
		await expect(page.getByText("審査中")).toBeVisible();
		await expect(
			page.getByRole("link", { name: "ログイン画面へ" }),
		).toBeVisible();
	});
});

// 受入条件の中核（登録された ID/PW で「承認後に」ログインできる／承認前はログインできない）を、
// 登録 → 承認前ログイン拒否 → admin 承認 → ログイン成功、の一巡で検証する。
// 申込側（未認証 page）と admin 側は別コンテキストにする。同一 page を admin でログインさせると
// middleware が /bars/register を /bars へリダイレクトし、登録フォームに到達できないため。
test.describe("店舗セルフサーブ登録: 承認フロー", () => {
	test("登録直後はログインできず、admin 承認後にログインできる", async ({
		page,
		browser,
	}) => {
		const uniqueId = `e2e-approval-${Date.now()}`;
		const password = "password123";

		// 1. 未ログインの店舗オーナーが申し込む
		await page.goto("/bars/register");
		await page.getByLabel("店舗ID").fill(uniqueId);
		await page.getByLabel("パスワード").fill(password);
		await page.getByLabel("管理者メールアドレス").fill("owner@example.com");
		await page.getByLabel("管理者電話番号").fill("09012345678");
		await page.getByRole("button", { name: "登録を申し込む" }).click();
		await expect(
			page.getByRole("heading", { name: "お申し込みを受け付けました" }),
		).toBeVisible();

		// 2. 承認前は作成した ID/PW でログインできない（審査中エラー）
		await page.goto("/login");
		await page.getByLabel("店舗ID").fill(uniqueId);
		await page.getByLabel("パスワード").fill(password);
		await page.getByRole("button", { name: "ログイン" }).click();
		await expect(page.getByText("審査中")).toBeVisible();
		await expect(page).toHaveURL(/\/login$/);

		// 3. admin が別コンテキストで /bars の審査中セクションから承認する
		const adminContext = await browser.newContext();
		const adminPage = await adminContext.newPage();
		await loginAsAdmin(adminPage);
		await adminPage.goto("/bars");
		// 過去実行で審査中店舗が複数残っていても取り違えないよう、この店舗IDを表示する要素を
		// 起点に、同じ行（直近の bg-amber-50 コンテナ）内の承認ボタンだけを対象にする。
		const pendingRow = adminPage
			.locator("div.bg-amber-50")
			.filter({ hasText: uniqueId });
		await expect(pendingRow).toBeVisible();
		await pendingRow.getByRole("button", { name: "承認する" }).click();
		// 承認が反映され、この行が審査中リストから外れる
		await expect(pendingRow).toHaveCount(0, { timeout: 10000 });
		await adminContext.close();

		// 4. 承認後は作成した ID/PW でログインできる（自店舗ページへ遷移）
		await page.goto("/login");
		await page.getByLabel("店舗ID").fill(uniqueId);
		await page.getByLabel("パスワード").fill(password);
		await page.getByRole("button", { name: "ログイン" }).click();
		await expect(page).toHaveURL(/\/bars\/\d+$/);
	});
});
