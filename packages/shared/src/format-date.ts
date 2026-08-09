/**
 * 日時を日本時間（JST）で整形するフォーマッタ群。
 *
 * `toLocaleDateString("ja-JP")` の第1引数はロケール（表記形式）の指定であって
 * タイムゾーンの指定ではない。`timeZone` を省略すると Intl は実行環境の TZ に
 * フォールバックするため、サーバー TZ が UTC の環境（Vercel）では
 * `Timestamptz` の値が9時間巻き戻って描画される。
 *
 * ローカル開発（Mac = JST）ではフォールバック先がたまたま正解になるため再現せず、
 * 日付のみ表示する箇所は JST 00:00〜08:59 のデータでしか症状が出ないため
 * 見落とされやすい。個別に `timeZone` を書き足す方式では今後追加する画面で
 * 同じ漏れが再発するため、web / admin 双方からこのモジュールを参照する。
 */

/**
 * Why not ユーザーのローカルタイムゾーンに追従させるか: 静岡県のバー向けサービスであり、
 * 多タイムゾーン対応の要件が README・database.md のいずれにも存在しない。
 * 将来ユーザー別 TZ が必要になった際の差し替え点をこの1箇所に絞る。
 */
export const APP_TIME_ZONE = "Asia/Tokyo";

export type DateInput = Date | string | number;

const toDate = (value: DateInput): Date =>
	value instanceof Date ? value : new Date(value);

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const format = (
	value: DateInput | null | undefined,
	options: Intl.DateTimeFormatOptions,
	fallback: string,
): string => {
	if (value === null || value === undefined || value === "") {
		return fallback;
	}

	const date = toDate(value);
	// Why not 不正な日付で例外を投げるか: 描画中の表示ロジックで throw すると
	// 日付1件の不整合でページ全体が落ちるため、フォールバック文字列に丸める。
	if (!isValidDate(date)) {
		return fallback;
	}

	return new Intl.DateTimeFormat("ja-JP", {
		timeZone: APP_TIME_ZONE,
		...options,
	}).format(date);
};

/** `2026/9/2` 形式。投稿日・クーポン有効期間などの短縮表記に使う。 */
export function formatDateJst(
	value: DateInput | null | undefined,
	fallback = "",
): string {
	return format(
		value,
		{ year: "numeric", month: "numeric", day: "numeric" },
		fallback,
	);
}

/** `2026年9月2日` 形式。生年月日・クーポン有効期限などの読み下し表記に使う。 */
export function formatDateLongJst(
	value: DateInput | null | undefined,
	fallback = "",
): string {
	return format(
		value,
		{ year: "numeric", month: "long", day: "numeric" },
		fallback,
	);
}

/** `2026年9月2日 8:00` 形式。イベント日時など日付と時刻を併記する箇所に使う。 */
export function formatDateTimeLongJst(
	value: DateInput | null | undefined,
	fallback = "",
): string {
	return format(
		value,
		{
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		},
		fallback,
	);
}

/** `2026/09/02 08:00` 形式。管理画面の一覧・詳細で日時を桁揃えして並べる箇所に使う。 */
export function formatDateTimeJst(
	value: DateInput | null | undefined,
	fallback = "",
): string {
	return format(
		value,
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		},
		fallback,
	);
}

/** `2026/09/02 08:00:00` 形式。秒まで必要な監査的な表示に使う。 */
export function formatDateTimeWithSecondsJst(
	value: DateInput | null | undefined,
	fallback = "",
): string {
	return format(
		value,
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		},
		fallback,
	);
}
