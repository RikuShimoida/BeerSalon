import { expect, test } from "./helpers/fixtures";

// E2E seed の bar 100001（bar_owner に紐付く固定バー）には bar_subscriptions の
// active 行が無いため、店舗詳細の課金カードは「課金を開始する」（Checkout 導線）を出す。
// 実 Stripe Price ID は未確定（placeholder）のため、Checkout の外部遷移そのものは
// E2E 対象外とし、「未サブスク店舗で課金開始ボタンが出て、押下で checkout API が
// 呼ばれる」ところまでを受入とする。
test.describe("サブスクリプション課金開始フロー", () => {
	test("未サブスクの店舗で『課金を開始する』ボタンが表示される", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/100001");

		const startButton = barOwnerPage.getByRole("button", {
			name: "課金を開始する",
		});
		await expect(startButton).toBeVisible();

		// 既存サブスクが無い店舗では Portal（支払い方法管理）ボタンは出ない
		await expect(
			barOwnerPage.getByRole("button", { name: "支払い方法管理" }),
		).toHaveCount(0);
	});

	// 課金状態を明示するステータスラベル（#514）。未サブスク店舗（seed の 100001）では
	// 「未課金」バッジが出る。「課金中」バッジ（サブスク有り時）は E2E seed に active な
	// bar_subscriptions 行が無いため E2E では検証できず、subscription API の UT
	// （subscription-api.test.ts）が status 集合による有無判定を担保する。
	test("未サブスクの店舗で『未課金』ステータスバッジが表示される", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/100001");

		await expect(barOwnerPage.getByText("未課金")).toBeVisible();
		await expect(barOwnerPage.getByText("課金中")).toHaveCount(0);
	});

	test("『課金を開始する』押下で checkout API が呼ばれる", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/100001");

		const startButton = barOwnerPage.getByRole("button", {
			name: "課金を開始する",
		});
		await expect(startButton).toBeVisible();

		const checkoutRequest = barOwnerPage.waitForRequest(
			(req) =>
				req.url().includes("/api/bars/100001/checkout") &&
				req.method() === "POST",
		);
		await startButton.click();

		await expect(checkoutRequest).resolves.toBeTruthy();
	});
});
