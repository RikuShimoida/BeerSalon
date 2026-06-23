import path from "node:path";
import { expect, test } from "./helpers/fixtures";

// Issue #295: ビールメニュー画像の入力UIを登録・編集とも「ファイルアップロード」に統一。
// 登録時にアップロードした画像が保存され、編集画面では既存画像をプレビュー表示し、
// 別画像への差し替えが一覧へ反映されることを検証する。
const IMAGE_A = path.join(__dirname, "fixtures", "menu-image-a.png");
const IMAGE_B = path.join(__dirname, "fixtures", "menu-image-b.png");

test.describe("Beer menu image upload (Issue #295)", () => {
	test("登録時に画像をアップロードでき、編集画面で差し替えると一覧に反映される", async ({
		barOwnerPage,
	}) => {
		const menuName = `E2E画像アップロードテスト_${Date.now()}`;

		// --- 登録: 画像Aをファイルアップロードして登録 ---
		await barOwnerPage.goto("/bars/100001/menus/new");

		await barOwnerPage.getByLabel("メニュー名").fill(menuName);
		await barOwnerPage
			.getByLabel("ビールカテゴリ")
			.selectOption({ label: "IPA" });
		await barOwnerPage.getByPlaceholder("パイント").first().fill("パイント");

		await barOwnerPage.getByLabel("画像").setInputFiles(IMAGE_A);
		// 選択直後にプレビューが表示される
		await expect(barOwnerPage.getByAltText("プレビュー")).toBeVisible();

		await barOwnerPage.getByRole("button", { name: "登録する" }).click();
		await expect(
			barOwnerPage.getByText("ビールメニューを登録しました"),
		).toBeVisible();

		// --- 一覧: 登録した画像が表示され、image_url が保存されている ---
		// メニュー管理ページのビールメニューカードに表示される
		await barOwnerPage.goto("/bars/100001/menus");
		const cardImage = barOwnerPage.getByAltText(menuName);
		await expect(cardImage).toBeVisible();
		const srcAfterCreate = await cardImage.getAttribute("src");
		// ビールマスタ画像ではなく、アップロードしたメニュー画像（bar-media）が保存されている
		expect(srcAfterCreate).toContain("bar-media");

		// --- 詳細 → 編集: カードから詳細へ進み、編集画面を開く ---
		await barOwnerPage.getByRole("link", { name: menuName }).first().click();
		await barOwnerPage.getByRole("link", { name: "編集" }).click();
		await expect(
			barOwnerPage.getByRole("heading", { name: "ビールメニュー編集" }),
		).toBeVisible();
		// 編集画面はURL手入力ではなくファイルアップロード方式。既存画像がプレビュー表示される
		await expect(barOwnerPage.getByAltText("プレビュー")).toBeVisible();

		// --- 画像Bへ差し替えて保存 ---
		await barOwnerPage
			.getByLabel("画像（店舗独自の写真）")
			.setInputFiles(IMAGE_B);
		await barOwnerPage.getByRole("button", { name: "保存" }).click();

		// --- 一覧: 差し替え後の画像が反映される（src が変わる） ---
		await expect(barOwnerPage).toHaveURL(/\/bars\/100001\/menus$/);
		const updatedImage = barOwnerPage.getByAltText(menuName);
		await expect(updatedImage).toBeVisible();
		const srcAfterEdit = await updatedImage.getAttribute("src");
		expect(srcAfterEdit).toContain("bar-media");
		expect(srcAfterEdit).not.toBe(srcAfterCreate);
	});
});
