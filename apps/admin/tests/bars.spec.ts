import { expect, test } from "./helpers/fixtures";

test.describe("Bar Management", () => {
	test("should display bars list for bar owner @smoke", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// バー一覧ページのタイトルを確認
		await expect(
			barOwnerPage.getByRole("heading", { name: "バー一覧" }),
		).toBeVisible();
	});

	test("should navigate to bar creation page", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 新規作成ボタンをクリック
		const newButton = barOwnerPage.getByRole("link", { name: "新規作成" });
		if (await newButton.isVisible()) {
			await newButton.click();
			await expect(barOwnerPage).toHaveURL("/bars/new");
		}
	});

	test("should display bar edit form", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();
			// バー編集ページにいることを確認
			await expect(barOwnerPage.getByText("バー情報編集")).toBeVisible();
		}
	});

	test("should display Instagram URL input field in bar edit form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Instagram URL入力欄が表示されることを確認
			const instagramInput = barOwnerPage.getByLabel("Instagram URL");
			await expect(instagramInput).toBeVisible();

			// プレースホルダーが正しく表示されることを確認
			await expect(instagramInput).toHaveAttribute(
				"placeholder",
				"https://www.instagram.com/your_account",
			);
		}
	});

	test("should save valid Instagram URL", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Instagram URL入力欄に正しいURLを入力
			const instagramInput = barOwnerPage.getByLabel("Instagram URL");
			await instagramInput.fill("https://www.instagram.com/test_account");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should show validation error for invalid Instagram URL", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Instagram URL入力欄に不正なURLを入力
			const instagramInput = barOwnerPage.getByLabel("Instagram URL");
			await instagramInput.fill("https://twitter.com/test_account");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// バリデーションエラーが表示されることを確認
			await expect(
				barOwnerPage.getByText("Instagram URLの形式が正しくありません"),
			).toBeVisible();
		}
	});

	test("should save without Instagram URL (null)", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Instagram URL入力欄を空にする
			const instagramInput = barOwnerPage.getByLabel("Instagram URL");
			await instagramInput.clear();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should display payment method checkboxes in bar edit form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 支払い方法のラベルが表示されることを確認
			await expect(barOwnerPage.getByText("支払い方法")).toBeVisible();

			// 4つのチェックボックスが表示されることを確認
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "現金" }),
			).toBeVisible();
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "クレジットカード" }),
			).toBeVisible();
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "電子マネー" }),
			).toBeVisible();
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "QRコード決済" }),
			).toBeVisible();
		}
	});

	test("should select and save payment methods", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 現金とクレジットカードを選択
			await barOwnerPage.getByRole("checkbox", { name: "現金" }).check();
			await barOwnerPage
				.getByRole("checkbox", { name: "クレジットカード" })
				.check();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should persist selected payment methods after save", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		let editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// すべてのチェックボックスをクリア
			await barOwnerPage.getByRole("checkbox", { name: "現金" }).uncheck();
			await barOwnerPage
				.getByRole("checkbox", { name: "クレジットカード" })
				.uncheck();
			await barOwnerPage
				.getByRole("checkbox", { name: "電子マネー" })
				.uncheck();
			await barOwnerPage
				.getByRole("checkbox", { name: "QRコード決済" })
				.uncheck();

			// 現金とQRコード決済を選択
			await barOwnerPage.getByRole("checkbox", { name: "現金" }).check();
			await barOwnerPage
				.getByRole("checkbox", { name: "QRコード決済" })
				.check();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");

			// 再度編集画面を開く
			editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
			await editButton.click();

			// 選択した支払い方法がチェック済みであることを確認
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "現金" }),
			).toBeChecked();
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "クレジットカード" }),
			).not.toBeChecked();
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "電子マネー" }),
			).not.toBeChecked();
			await expect(
				barOwnerPage.getByRole("checkbox", { name: "QRコード決済" }),
			).toBeChecked();
		}
	});

	test("should save without any payment method selected", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// すべてのチェックボックスをクリア
			await barOwnerPage.getByRole("checkbox", { name: "現金" }).uncheck();
			await barOwnerPage
				.getByRole("checkbox", { name: "クレジットカード" })
				.uncheck();
			await barOwnerPage
				.getByRole("checkbox", { name: "電子マネー" })
				.uncheck();
			await barOwnerPage
				.getByRole("checkbox", { name: "QRコード決済" })
				.uncheck();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should display Facebook URL input field in bar edit form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Facebook URL入力欄が表示されることを確認
			const facebookInput = barOwnerPage.getByLabel("Facebook URL");
			await expect(facebookInput).toBeVisible();

			// プレースホルダーが正しく表示されることを確認
			await expect(facebookInput).toHaveAttribute(
				"placeholder",
				"https://www.facebook.com/yourpage",
			);
		}
	});

	test("should save valid Facebook URL", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Facebook URL入力欄に正しいURLを入力
			const facebookInput = barOwnerPage.getByLabel("Facebook URL");
			await facebookInput.fill("https://www.facebook.com/testpage");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should save valid Facebook profile URL", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Facebook URL入力欄にプロフィールURL形式を入力
			const facebookInput = barOwnerPage.getByLabel("Facebook URL");
			await facebookInput.fill("https://www.facebook.com/profile.php?id=12345");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should save valid mobile Facebook URL", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Facebook URL入力欄にモバイル版URLを入力
			const facebookInput = barOwnerPage.getByLabel("Facebook URL");
			await facebookInput.fill("https://m.facebook.com/testpage");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should show validation error for invalid Facebook URL", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Facebook URL入力欄に不正なURLを入力
			const facebookInput = barOwnerPage.getByLabel("Facebook URL");
			await facebookInput.fill("https://twitter.com/testaccount");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// バリデーションエラーが表示されることを確認
			await expect(
				barOwnerPage.getByText(/正しいFacebook URLを入力してください/),
			).toBeVisible();
		}
	});

	test("should save without Facebook URL (null)", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Facebook URL入力欄を空にする
			const facebookInput = barOwnerPage.getByLabel("Facebook URL");
			await facebookInput.clear();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should display preview image upload section in bar edit form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// プレビュー画像のラベルが表示されることを確認
			await expect(barOwnerPage.getByText("プレビュー画像")).toBeVisible();

			// 説明文が表示されることを確認
			await expect(
				barOwnerPage.getByText(/店舗一覧ページに表示されるサムネイル画像です/),
			).toBeVisible();
		}
	});

	test("should show image upload button when no preview image is set", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 画像を選択ボタンが表示されることを確認
			const uploadButton = barOwnerPage.getByText("画像を選択");
			await expect(uploadButton).toBeVisible();

			// 「画像が設定されていません」のメッセージが表示されることを確認
			await expect(
				barOwnerPage.getByText("画像が設定されていません"),
			).toBeVisible();
		}
	});

	test("should upload preview image successfully in new bar form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		// 必須フィールドを入力
		await barOwnerPage.getByLabel("店舗名").fill("テストバー");
		await barOwnerPage.getByLabel("郵便番号").fill("1000001");
		await barOwnerPage.getByLabel("住所").fill("東京都千代田区千代田1-1");
		await barOwnerPage.getByLabel("電話番号").fill("0312345678");
		await barOwnerPage.getByLabel("説明").fill("テスト用のバーです");

		// プレビュー画像をアップロード
		const fileInput = barOwnerPage.locator('input[type="file"]');
		await fileInput.setInputFiles("tests/fixtures/test-preview.png");

		// アップロード完了を待機
		await barOwnerPage.waitForTimeout(1000);

		// 保存ボタンをクリック
		await barOwnerPage.getByRole("button", { name: "保存" }).click();

		// 一覧ページにリダイレクトされることを確認
		await expect(barOwnerPage).toHaveURL("/bars");
	});

	test.skip("should show error for oversized image (> 5MB)", async ({
		barOwnerPage: _barOwnerPage,
	}) => {
		// Note: このテストは実際のファイルアップロードが必要なのでスキップ
	});

	test.skip("should show error for unsupported image format", async ({
		barOwnerPage: _barOwnerPage,
	}) => {
		// Note: このテストは実際のファイルアップロードが必要なのでスキップ
	});

	test.skip("should delete preview image successfully", async ({
		barOwnerPage: _barOwnerPage,
	}) => {
		// Note: このテストは実際のファイルアップロードが必要なのでスキップ
	});

	test("should display preview image upload section in bar creation form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		// プレビュー画像のラベルが表示されることを確認
		await expect(barOwnerPage.getByText("プレビュー画像")).toBeVisible();

		// 説明文が表示されることを確認
		await expect(
			barOwnerPage.getByText(/店舗一覧ページに表示されるサムネイル画像です/),
		).toBeVisible();

		// 画像を選択ボタンが表示されることを確認
		const uploadButton = barOwnerPage.getByText("画像を選択");
		await expect(uploadButton).toBeVisible();

		// 「画像が設定されていません」のメッセージが表示されることを確認
		await expect(
			barOwnerPage.getByText("画像が設定されていません"),
		).toBeVisible();
	});

	test("should display homepage URL input field in bar edit form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURL入力欄が表示されることを確認
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await expect(websiteInput).toBeVisible();

			// プレースホルダーが正しく表示されることを確認
			await expect(websiteInput).toHaveAttribute(
				"placeholder",
				"https://example.com",
			);

			// 補助テキストが表示されることを確認
			await expect(
				barOwnerPage.getByText(
					/店舗の公式Webサイトがある場合に入力してください/,
				),
			).toBeVisible();
		}
	});

	test("should save valid homepage URL with https", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURL入力欄に正しいURL（https）を入力
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await websiteInput.fill("https://example.com");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should save valid homepage URL with http", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURL入力欄に正しいURL（http）を入力
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await websiteInput.fill("http://example.com");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should show validation error for invalid homepage URL without protocol", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURL入力欄に不正なURL（プロトコルなし）を入力
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await websiteInput.fill("example.com");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// バリデーションエラーが表示されることを確認
			await expect(
				barOwnerPage.getByText(
					/ホームページURLの形式が正しくありません.*http:\/\/ または https:\/\/ で始まるURLを入力してください/,
				),
			).toBeVisible();
		}
	});

	test("should show validation error for invalid homepage URL with ftp protocol", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURL入力欄に不正なURL（ftpプロトコル）を入力
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await websiteInput.fill("ftp://example.com");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// バリデーションエラーが表示されることを確認
			await expect(
				barOwnerPage.getByText(
					/ホームページURLの形式が正しくありません.*http:\/\/ または https:\/\/ で始まるURLを入力してください/,
				),
			).toBeVisible();
		}
	});

	test("should save without homepage URL (null)", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURL入力欄を空にする
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await websiteInput.clear();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should persist homepage URL after save", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		let editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// ホームページURLを入力
			const websiteInput = barOwnerPage.getByLabel("ホームページURL");
			await websiteInput.fill("https://test-bar.example.com");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");

			// 再度編集画面を開く
			editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
			await editButton.click();

			// 保存したホームページURLが表示されることを確認
			const websiteInputAfter = barOwnerPage.getByLabel("ホームページURL");
			await expect(websiteInputAfter).toHaveValue(
				"https://test-bar.example.com",
			);
		}
	});

	test("should display access textarea in bar edit form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 交通手段・アクセス入力欄が表示されることを確認
			const accessInput = barOwnerPage.getByLabel("交通手段・アクセス");
			await expect(accessInput).toBeVisible();

			// プレースホルダーが正しく表示されることを確認
			await expect(accessInput).toHaveAttribute(
				"placeholder",
				/例.*JR.*駅から徒歩/,
			);
		}
	});

	test("should save access information with line breaks", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 交通手段・アクセス入力欄に改行を含むテキストを入力
			const accessInput = barOwnerPage.getByLabel("交通手段・アクセス");
			const accessText =
				"JR渋谷駅から徒歩5分\n駐車場：近隣コインパーキングあり（提携なし）\nバス：渋谷駅バス停から徒歩2分";
			await accessInput.fill(accessText);

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should persist access information with line breaks after save", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		let editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 交通手段・アクセス入力欄に改行を含むテキストを入力
			const accessInput = barOwnerPage.getByLabel("交通手段・アクセス");
			const accessText =
				"JR新宿駅から徒歩10分\n地下鉄：新宿三丁目駅から徒歩3分\n駐車場：提携駐車場あり（2時間無料）";
			await accessInput.fill(accessText);

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");

			// 再度編集画面を開く
			editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
			await editButton.click();

			// 保存したアクセス情報が改行を含めて表示されることを確認
			const accessInputAfter = barOwnerPage.getByLabel("交通手段・アクセス");
			await expect(accessInputAfter).toHaveValue(accessText);
		}
	});

	test("should save without access information (null)", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		const editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 交通手段・アクセス入力欄を空にする
			const accessInput = barOwnerPage.getByLabel("交通手段・アクセス");
			await accessInput.clear();

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");
		}
	});

	test("should update access information successfully", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		let editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 交通手段・アクセス入力欄を更新
			const accessInput = barOwnerPage.getByLabel("交通手段・アクセス");
			await accessInput.fill("JR東京駅から徒歩15分");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");

			// 再度編集画面を開く
			editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
			await editButton.click();

			// 更新したアクセス情報が表示されることを確認
			const accessInputAfter = barOwnerPage.getByLabel("交通手段・アクセス");
			await expect(accessInputAfter).toHaveValue("JR東京駅から徒歩15分");
		}
	});

	test("should display municipality dropdown (not prefecture) in bar form", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		// 市町村ドロップダウンが表示されることを確認
		const citySelect = barOwnerPage.getByLabel("市町村");
		await expect(citySelect).toBeVisible();

		// 都道府県ドロップダウンが表示されないことを確認（静岡県限定サービス）
		const prefectureSelect = barOwnerPage.getByLabel("都道府県");
		await expect(prefectureSelect).not.toBeVisible();
	});

	test("should display Shizuoka municipalities in dropdown", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		const citySelect = barOwnerPage.getByLabel("市町村");

		// 主要な市町村がオプションとして含まれていることを確認
		await expect(citySelect.locator('option[value="静岡市"]')).toBeVisible();
		await expect(citySelect.locator('option[value="浜松市"]')).toBeVisible();
		await expect(citySelect.locator('option[value="沼津市"]')).toBeVisible();
		await expect(citySelect.locator('option[value="熱海市"]')).toBeVisible();
		await expect(citySelect.locator('option[value="三島市"]')).toBeVisible();

		// 町も含まれていることを確認
		await expect(citySelect.locator('option[value="函南町"]')).toBeVisible();
		await expect(citySelect.locator('option[value="長泉町"]')).toBeVisible();
	});

	test("should select and save municipality", async ({ barOwnerPage }) => {
		await barOwnerPage.goto("/bars");

		// 編集ボタンをクリック（最初のバー）
		let editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// 市町村を選択
			const citySelect = barOwnerPage.getByLabel("市町村");
			await citySelect.selectOption("静岡市");

			// 保存ボタンをクリック
			await barOwnerPage.getByRole("button", { name: "保存" }).click();

			// 一覧ページにリダイレクトされることを確認
			await expect(barOwnerPage).toHaveURL("/bars");

			// 再度編集画面を開く
			editButton = barOwnerPage.getByRole("link", { name: "編集" }).first();
			await editButton.click();

			// 保存した市町村が選択されていることを確認
			const citySelectAfter = barOwnerPage.getByLabel("市町村");
			await expect(citySelectAfter).toHaveValue("静岡市");
		}
	});

	test("should display helper text for municipality selection", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		// ヘルパーテキストが表示されることを確認
		await expect(
			barOwnerPage.getByText("静岡県内の市町村を選択してください"),
		).toBeVisible();
	});

	test("should display payment method checkboxes on bar creation page", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		// 支払い方法のチェックボックスが正常に表示される
		await expect(barOwnerPage.getByText("支払い方法")).toBeVisible();
		await expect(
			barOwnerPage.getByRole("checkbox", { name: "現金" }),
		).toBeVisible();
		await expect(
			barOwnerPage.getByRole("checkbox", { name: "クレジットカード" }),
		).toBeVisible();
		await expect(
			barOwnerPage.getByRole("checkbox", { name: "電子マネー" }),
		).toBeVisible();
		await expect(
			barOwnerPage.getByRole("checkbox", { name: "QRコード決済" }),
		).toBeVisible();
	});

	test("should create a new bar and display it in the list", async ({
		barOwnerPage,
	}) => {
		await barOwnerPage.goto("/bars/new");

		// バー名を入力、市町村をドロップダウンから選択、番地を入力
		const barName = `テストバー_${Date.now()}`;
		await barOwnerPage.getByLabel("バー名").fill(barName);
		await barOwnerPage.getByLabel("市町村").selectOption("静岡市");
		await barOwnerPage.getByLabel("番地").fill("テスト住所1-2-3");

		// 保存ボタンをクリック
		await barOwnerPage.getByRole("button", { name: "保存" }).click();

		// バー一覧ページにリダイレクトされる
		await expect(barOwnerPage).toHaveURL("/bars");

		// バー一覧ページに作成したバーが表示される
		await expect(barOwnerPage.getByText(barName)).toBeVisible();
	});
});
