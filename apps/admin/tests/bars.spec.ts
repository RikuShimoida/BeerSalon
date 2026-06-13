import { expect, test } from "./helpers/fixtures";

test.describe("Bar Management", () => {
	test("should display bars list for admin", async ({ adminPage }) => {
		await adminPage.goto("/bars");

		// 店舗管理ページのタイトルを確認
		await expect(
			adminPage.getByRole("heading", { name: "店舗管理" }),
		).toBeVisible();
	});
});
