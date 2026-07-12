/**
 * 静岡県の市町村マスタデータ（ユーザー画面・管理画面で共有する単一の正）
 * BeerSalonは静岡県限定サービスのため、静岡県の市町村のみを管理する。
 *
 * Why not: 政令市を「静岡市（葵区）」のように区付きで持たない。
 * 店舗登録（管理画面）が保存する bars.city は区を持たない粒度（例: 「静岡市」）であり、
 * ユーザー画面の市町村フィルターが区付きの値を渡すと完全一致で永久にヒットしない（Issue #419）。
 * 検索側・登録側の語彙を区なしで統一するため、区は列挙しない。
 */

export const SHIZUOKA_PREFECTURE = "静岡県";

/**
 * 静岡県の市（23市）
 */
export const SHIZUOKA_CITIES = [
	"静岡市",
	"浜松市",
	"沼津市",
	"熱海市",
	"三島市",
	"富士宮市",
	"伊東市",
	"島田市",
	"富士市",
	"磐田市",
	"焼津市",
	"掛川市",
	"藤枝市",
	"御殿場市",
	"袋井市",
	"下田市",
	"裾野市",
	"湖西市",
	"伊豆市",
	"御前崎市",
	"菊川市",
	"伊豆の国市",
	"牧之原市",
] as const;

/**
 * 静岡県の町（12町）
 */
export const SHIZUOKA_TOWNS = [
	"東伊豆町",
	"河津町",
	"南伊豆町",
	"松崎町",
	"西伊豆町",
	"函南町",
	"清水町",
	"長泉町",
	"小山町",
	"吉田町",
	"川根本町",
	"森町",
] as const;

/**
 * 静岡県の全市町村（35市町）
 * 市を先に、町を後に配置
 */
export const SHIZUOKA_MUNICIPALITIES = [
	...SHIZUOKA_CITIES,
	...SHIZUOKA_TOWNS,
] as const;

export type ShizuokaMunicipality = (typeof SHIZUOKA_MUNICIPALITIES)[number];
