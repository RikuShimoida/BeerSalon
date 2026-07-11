import path from "node:path";
import { expect, test } from "./helpers/fixtures";

// Issue #318: メニュー画像がスライダー枠（最大5枚）を消費しない不変条件の回帰防御。
// PR #314（Issue #295）で「メニュー画像が image_type='slider' 固定で bar_images へ
// INSERT され、店舗スライダー画像枠を消費していた」隠れ不具合を修正済み。
// 本 E2E は、スライダーが5枚で埋まった状態でもビールメニュー画像の登録が成功し、
// かつスライダーが5枚のまま増えていないことをブラウザ経由の実フローで担保する。
//
// 対応UT: apps/admin/src/__tests__/media-api.test.ts
//   「type=beer-menu はスライダー5枚到達済みでも 5枚制限に弾かれずアップロードできる」
//   をブラウザ実フローで補完する位置づけ。
const IMAGE_A = path.join(__dirname, "fixtures", "menu-image-a.png");
const IMAGE_B = path.join(__dirname, "fixtures", "menu-image-b.png");

const BAR_ID = 100001;
const MAX_SLIDER = 5;

// SliderMediaManager.tsx が表示する枚数テキスト「登録済み: N / 5枚」を読む。
// 実コードの該当箇所:
//   <p>...（登録済み: {currentCount} / {MAX_MEDIA_COUNT}枚）</p>
function sliderCountText(count: number): RegExp {
	return new RegExp(`登録済み: ${count} / ${MAX_SLIDER}枚`);
}

test.describe("Menu image does not consume slider quota (Issue #318)", () => {
	test("スライダー5枚で埋まっていてもビールメニュー画像の登録が成功し、スライダーは5枚のまま", async ({
		barOwnerPage,
	}) => {
		// SliderMediaManager の削除は window.confirm を使うため、ダイアログは常に承認する。
		barOwnerPage.on("dialog", (dialog) => dialog.accept());

		// --- 前提リセット: スライダー画像を一度0枚にする（冪等性担保） ---
		// seed.e2e.sql は bar 100001 に bar_images を入れないが、過去の本テスト実行で
		// アップロードしたスライダー画像が DB に残り得る（e2e:setup は bar_images を
		// truncate しない）。既存枚数に依存せず必ず5枚ちょうどから始めるため、
		// 編集画面で残存スライダー画像をすべて削除してから5枚を投入する。
		await barOwnerPage.goto(`/bars/${BAR_ID}/edit`);
		await expect(barOwnerPage.getByText(/登録済み: \d+ \/ 5枚/)).toBeVisible();

		// スライダー削除ボタンに限定する。
		// 同一編集画面には「プレビュー画像」用の別「削除」ボタン（BarEditForm.tsx の
		// L748-755 付近）も存在し、name:"削除" で広く拾うとプレビュー削除を巻き込み
		// flaky 化し得る。SliderMediaManager.tsx の編集モードは、各スライダーカードを
		// 同一クラス（bg-gray-50 rounded-lg p-3 border border-gray-200）の div で包み、
		// その中に alt="スライダー画像 N" の画像と「削除」ボタンを同居させているため
		// （L342-411）、カード単位（=画像とボタンが 1:1 で同居する最小コンテナ）に
		// scope する。各カードはスライダー画像をちょうど1枚持つので、has フィルタで
		// alt 画像を持つカードに絞れば、カードごとに「削除」ボタンが1つだけ対象になる。
		const sliderCards = barOwnerPage
			.locator("div.bg-gray-50.rounded-lg.p-3.border.border-gray-200")
			.filter({ has: barOwnerPage.getByAltText(/スライダー画像 \d+/) });
		const sliderDeleteButtons = sliderCards.getByRole("button", {
			name: "削除",
		});
		// 削除1回ごとに件数が1つ減るのをアサーションの同期点として待つ。
		// 初期件数を起点に、残数を明示的に指定して縮退を待機する（DOM変化との競合回避）。
		let remaining = await sliderDeleteButtons.count();
		while (remaining > 0) {
			await sliderDeleteButtons.first().click();
			remaining -= 1;
			// 削除→サーバー反映→再フェッチで件数が remaining に減るのを待つ。
			await expect(sliderDeleteButtons).toHaveCount(remaining);
		}
		await expect(barOwnerPage.getByText(sliderCountText(0))).toBeVisible();

		// --- スライダー画像を5枚アップロードして枠を埋める ---
		// 編集モードのファイル入力は id="slider-media-upload"。アップロード後に
		// input.value をクリアするため、同じ fixture を繰り返し選択できる。
		const sliderInput = barOwnerPage.locator("#slider-media-upload");
		for (let i = 1; i <= MAX_SLIDER; i++) {
			await sliderInput.setInputFiles(IMAGE_A);
			// 1枚アップロードされ枚数表示が i に進むのを待つ（サーバー反映の同期点）。
			await expect(barOwnerPage.getByText(sliderCountText(i))).toBeVisible();
		}

		// スライダーが5枚で埋まり、追加ボタンが無効化されていることを確認。
		await expect(
			barOwnerPage.getByText(sliderCountText(MAX_SLIDER)),
		).toBeVisible();
		// 5枚到達時、SliderMediaManager は「+ 追加」ラベルのボタンを無効化する。
		await expect(barOwnerPage.getByText("+ 追加")).toBeVisible();
		await expect(sliderInput).toBeDisabled();
		// スライダー画像要素（alt="スライダー画像 N"）がちょうど5枚描画されている。
		await expect(barOwnerPage.getByAltText(/スライダー画像 \d+/)).toHaveCount(
			MAX_SLIDER,
		);

		// --- スライダー5枚の状態でビールメニュー画像付き登録が成功する ---
		const menuName = `E2Eスライダー枠回帰_${Date.now()}`;
		await barOwnerPage.goto(`/bars/${BAR_ID}/menus/new`);
		await barOwnerPage.getByLabel("メニュー名").fill(menuName);
		await barOwnerPage
			.getByLabel("ビールカテゴリ")
			.selectOption({ label: "IPA" });
		await barOwnerPage.getByPlaceholder("パイント").first().fill("パイント");

		// メニュー画像（type=beer-menu）をアップロード。これがスライダー枠を消費しないことが本旨。
		await barOwnerPage.getByLabel("画像").setInputFiles(IMAGE_B);
		await expect(barOwnerPage.getByAltText("プレビュー")).toBeVisible();

		await barOwnerPage.getByRole("button", { name: "登録する" }).click();
		// スライダーが5枚で埋まっていても、メニュー画像登録は成功する。
		await expect(
			barOwnerPage.getByText("ビールメニューを登録しました"),
		).toBeVisible();

		// 登録したメニューがメニュー管理ページに反映され、メニュー画像が bar-media 由来で保存される。
		await barOwnerPage.goto(`/bars/${BAR_ID}/menus`);
		const cardImage = barOwnerPage.getByAltText(menuName);
		await expect(cardImage).toBeVisible();
		const menuImageSrc = await cardImage.getAttribute("src");
		expect(menuImageSrc).toContain("bar-media");

		// --- スライダーが5枚のまま（メニュー画像で枠が増えていない）ことを確認 ---
		await barOwnerPage.goto(`/bars/${BAR_ID}/edit`);
		await expect(
			barOwnerPage.getByText(sliderCountText(MAX_SLIDER)),
		).toBeVisible();
		// 6枚に増えていない（メニュー画像が bar_images の slider 枠を消費していない）。
		await expect(barOwnerPage.getByAltText(/スライダー画像 \d+/)).toHaveCount(
			MAX_SLIDER,
		);
	});
});
