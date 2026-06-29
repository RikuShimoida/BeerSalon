export type MenuImageType = "beer-menu" | "food-menu";

export type MenuImageUploadResult =
	| { ok: true; url: string | null }
	| { ok: false; error: string };

// Why not 戻り値を string | null にしない:
//   登録フォームはアップロード失敗を握りつぶし、編集フォームは失敗レスポンスの
//   error 文言を読んで中断する。両者の挙動を維持するには成功/失敗を判別できる
//   結果型が必要で、string | null では「成功かつ url なし」と「失敗」を区別できない。
export async function uploadMenuImage(
	barId: string,
	file: File,
	type: MenuImageType,
): Promise<MenuImageUploadResult> {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("type", type);

	const uploadRes = await fetch(`/api/bars/${barId}/media`, {
		method: "POST",
		body: formData,
	});

	if (!uploadRes.ok) {
		const data = await uploadRes.json();
		return {
			ok: false,
			error: data.error || "画像のアップロードに失敗しました",
		};
	}

	const uploadData = await uploadRes.json();
	return { ok: true, url: uploadData.url || null };
}
