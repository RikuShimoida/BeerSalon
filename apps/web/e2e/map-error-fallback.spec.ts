import { expect, test } from "@playwright/test";
import { loginAsSmokeUser } from "./helpers/auth";

// Why not 本物の Google 地図スクリプト: 失敗するかどうかが Google 側の更新と読み込みのタイミング次第で、
// 毎回同じ結果にならない。地図の生成（new google.maps.Map）で必ず例外を投げる偽スクリプトを返す。
const FAILING_MAPS_SCRIPT = `
window.google = window.google || {};
window.google.maps = window.google.maps || {};
window.google.maps.importLibrary = async () => ({});
window.google.maps.Map = function () {
	throw new Error("E2E: 地図の生成に失敗");
};
window.__googleMapsCallback__();
`;

test.describe("トップページ（地図の読み込み失敗）", () => {
	test.beforeEach(async ({ page }) => {
		await page.route(
			/^https:\/\/maps\.googleapis\.com\/maps\/api\/js/,
			(route) =>
				route.fulfill({
					status: 200,
					contentType: "text/javascript",
					body: FAILING_MAPS_SCRIPT,
				}),
		);
		await loginAsSmokeUser(page);
	});

	test("地図が失敗しても、地図の枠だけが差し替わり、店舗一覧と検索はそのまま使える", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(page.getByText("地図を表示できませんでした")).toBeVisible();
		await expect(page.getByText("お店は一覧から探せます")).toBeVisible();
		await expect(page.getByText("This page couldn’t load")).toHaveCount(0);

		// seed.e2e.sql: 100002（東京）は緯度経度ありでピン描画の対象。失敗後も一覧に残ること。
		await expect(page.getByText("E2Eテストバー静岡")).toBeVisible();
		await expect(page.getByText("E2Eテストバー東京")).toBeVisible();

		await page.fill("#search-keyword", "東京");
		await page.getByRole("button", { name: "検索" }).click();

		await expect(page).toHaveURL(/\?q=%E6%9D%B1%E4%BA%AC|\?q=東京/);
		await expect(page.getByText("E2Eテストバー東京")).toBeVisible();
		await expect(page.getByText("E2Eテストバー静岡")).toHaveCount(0);
		await expect(page.getByText("地図を表示できませんでした")).toBeVisible();
	});
});
