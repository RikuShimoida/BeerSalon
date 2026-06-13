/**
 * バー登録フォーム自動入力スクリプト
 *
 * 使い方:
 * 1. http://localhost:3001/bars/new を開く
 * 2. ブラウザのコンソールでこのスクリプトを実行
 * 3. フォームに自動的にテストデータが入力される
 */

(() => {
	console.log("🍺 バー登録フォーム自動入力開始...");

	// React の状態を正しく更新する関数
	const setReactInput = (selector, value) => {
		const el = document.querySelector(selector);
		if (!el) return;

		// React の内部プロパティを使って値を設定
		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			"value",
		).set;
		const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLTextAreaElement.prototype,
			"value",
		).set;
		const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLSelectElement.prototype,
			"value",
		).set;

		if (el.tagName === "INPUT") {
			nativeInputValueSetter.call(el, value);
		} else if (el.tagName === "TEXTAREA") {
			nativeTextAreaValueSetter.call(el, value);
		} else if (el.tagName === "SELECT") {
			nativeSelectValueSetter.call(el, value);
		}

		// React のイベントを発火
		el.dispatchEvent(new Event("input", { bubbles: true }));
		el.dispatchEvent(new Event("change", { bubbles: true }));
	};

	// バー名
	setReactInput('input[name="name"]', "テストバー");

	// 都道府県
	setReactInput('select[name="prefecture"]', "東京都");

	// 市区町村
	setReactInput('input[name="city"]', "渋谷区");

	// 番地
	setReactInput('input[name="address_line1"]', "神南1-2-3");

	// 建物名
	setReactInput('input[name="address_line2"]', "テストビル 4F");

	// 電話番号
	setReactInput('input[name="phone_number"]', "03-1234-5678");

	// 交通手段・アクセス
	setReactInput(
		'textarea[name="access"]',
		"JR渋谷駅から徒歩5分\n地下鉄：渋谷駅から徒歩3分\n駐車場：近隣コインパーキングあり（提携なし）",
	);

	// ウェブサイトURL
	setReactInput('input[name="website_url"]', "https://example.com");

	// Instagram URL
	setReactInput(
		'input[name="instagram_url"]',
		"https://www.instagram.com/testbar",
	);

	// X (Twitter) URL
	setReactInput('input[name="x_url"]', "https://x.com/testbar");

	// Facebook URL
	setReactInput(
		'input[name="facebook_url"]',
		"https://www.facebook.com/testbar",
	);

	// LINE URL
	setReactInput('input[name="line_url"]', "https://line.me/R/ti/p/@testbar");

	// PR文
	setReactInput(
		'textarea[name="description"]',
		"クラフトビール専門のバーです。常時20種類以上のタップビールをご用意しております。",
	);

	// 営業時間の設定
	// 1. まず全ての定休日チェックボックスをオフにする
	const closedCheckboxes = document.querySelectorAll('input[type="checkbox"]');
	closedCheckboxes.forEach((cb) => {
		const label = cb.nextElementSibling;
		if (label?.textContent?.includes("定休日") && cb.checked) {
			cb.click();
		}
	});

	// 2. 少し待ってからtime入力を設定（DOM更新を待つ）
	setTimeout(() => {
		const timeInputs = document.querySelectorAll('input[type="time"]');
		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			"value",
		).set;

		timeInputs.forEach((input, index) => {
			const isOpenTime = index % 2 === 0;
			const timeValue = isOpenTime ? "17:00" : "23:00";

			// React の内部プロパティを使って値を設定
			nativeInputValueSetter.call(input, timeValue);
			input.dispatchEvent(new Event("input", { bubbles: true }));
			input.dispatchEvent(new Event("change", { bubbles: true }));
		});
	}, 100);

	// 支払い方法（すべてチェック）
	setTimeout(() => {
		const paymentMethods = [
			"現金",
			"クレジットカード",
			"電子マネー",
			"QRコード決済",
		];
		const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

		allCheckboxes.forEach((checkbox) => {
			const label = checkbox.nextElementSibling;
			if (label?.textContent) {
				// 支払い方法のいずれかに一致する場合のみチェック
				const isPaymentMethod = paymentMethods.some((method) =>
					label.textContent.includes(method),
				);

				if (isPaymentMethod && !checkbox.checked) {
					checkbox.click();
				}
			}
		});

		console.log("💳 支払い方法を選択しました");
	}, 200);

	console.log("✅ フォーム入力完了！");
	console.log("📝 プレビュー画像は手動で選択してください");
	console.log("💾 「保存」ボタンは押さないでください（テストデータのため）");
})();
