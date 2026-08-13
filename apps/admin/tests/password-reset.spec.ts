import { expect, test } from "@playwright/test";

// 管理画面パスワード再設定（未ログインの店舗オーナーが使う公開フロー）の受入条件を検証する。
//
// Why not メール受信までを E2E で検証しない: 再設定リンクの平文トークンはメール本文にのみ
// 含まれ、DB には SHA-256 ハッシュしか保存しない。実メール到達は Resend の運用設定
// （RESEND_API_KEY / 送信元ドメイン、#405 と同種の運用作業）に依存するため、
// 「トークンからの新パスワード設定 → 更新」の成功系はロジックを UT
// （api/auth/password/reset/route.test.ts）で担保する。ここでは画面遷移・列挙対策・
// 無効トークンのエラー表示という、UI から観測できる受入条件を検証する。
test.describe("管理画面パスワード再設定", () => {
	test("ログイン画面から「パスワードをお忘れの方」導線で申請画面へ遷移できる", async ({
		page,
	}) => {
		await page.goto("/login");

		await page.getByRole("link", { name: "パスワードをお忘れの方" }).click();

		await expect(page).toHaveURL(/\/password\/forgot$/);
		await expect(
			page.getByRole("heading", { name: "パスワード再設定" }),
		).toBeVisible();
		await expect(page.getByLabel("店舗ID")).toBeVisible();
	});

	test("存在する店舗IDで申請すると中立の完了メッセージが表示される", async ({
		page,
	}) => {
		await page.goto("/password/forgot");

		await page.getByLabel("店舗ID").fill("e2e-bar-owner");
		await page.getByRole("button", { name: "再設定メールを送信" }).click();

		await expect(
			page.getByText(
				"入力された店舗IDが登録されていれば、再設定メールを送信しました",
			),
		).toBeVisible();
	});

	test("存在しない店舗IDでも同一の中立メッセージが表示される（ユーザー列挙対策）", async ({
		page,
	}) => {
		await page.goto("/password/forgot");

		await page.getByLabel("店舗ID").fill(`non-existent-${Date.now()}`);
		await page.getByRole("button", { name: "再設定メールを送信" }).click();

		// 存在する店舗IDのケースと文言が完全一致すること（登録有無を区別しない）。
		await expect(
			page.getByText(
				"入力された店舗IDが登録されていれば、再設定メールを送信しました",
			),
		).toBeVisible();
	});

	test("トークン無しで再設定画面にアクセスすると無効メッセージが表示され、送信できない", async ({
		page,
	}) => {
		await page.goto("/password/reset");

		await expect(
			page.getByText(
				"再設定リンクが無効です。もう一度お手続きをやり直してください。",
			),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "パスワードを設定" }),
		).toBeDisabled();
	});

	test("無効なトークンで新パスワードを設定するとエラーが表示される", async ({
		page,
	}) => {
		await page.goto("/password/reset?token=invalid-token-value");

		await page
			.getByLabel("新しいパスワード", { exact: true })
			.fill("newpass123");
		await page.getByLabel("新しいパスワード（確認）").fill("newpass123");
		await page.getByRole("button", { name: "パスワードを設定" }).click();

		await expect(
			page.getByText("再設定リンクが無効か、有効期限が切れています"),
		).toBeVisible();
	});

	test("パスワードと確認が不一致ならクライアント側でエラーになる", async ({
		page,
	}) => {
		await page.goto("/password/reset?token=some-token");

		await page
			.getByLabel("新しいパスワード", { exact: true })
			.fill("newpass123");
		await page.getByLabel("新しいパスワード（確認）").fill("different456");
		await page.getByRole("button", { name: "パスワードを設定" }).click();

		await expect(page.getByText("パスワードが一致しません")).toBeVisible();
	});
});
