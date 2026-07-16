// beers.abv は numeric(4,2) NULLABLE。管理画面のビールメニュー登録/編集で
// 任意入力されたアルコール度数を、DB 保存前に検証・正規化する共通ロジック。

export const ABV_MIN = 0;
export const ABV_MAX = 99.99;

export type NormalizeAbvResult =
	| { ok: true; value: number | null }
	| { ok: false; error: string };

// 入力値（未指定 / 空文字 / 数値 / 数値文字列）を beers.abv の保存値へ正規化する。
// 未入力は null（任意項目のため）。範囲外・非数値はエラーを返し、暗黙補正はしない。
export function normalizeAbv(input: unknown): NormalizeAbvResult {
	if (input === null || input === undefined || input === "") {
		return { ok: true, value: null };
	}

	const value = typeof input === "number" ? input : Number(input);

	if (typeof value !== "number" || Number.isNaN(value)) {
		return { ok: false, error: "アルコール度数は数値で入力してください" };
	}

	if (value < ABV_MIN || value > ABV_MAX) {
		return {
			ok: false,
			error: `アルコール度数は${ABV_MIN}〜${ABV_MAX}の範囲で入力してください`,
		};
	}

	return { ok: true, value };
}
