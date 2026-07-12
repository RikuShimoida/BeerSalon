/**
 * 静岡県の市町村マスタデータ
 *
 * Why not: admin 独自にリストを保持しない。
 * ユーザー画面（検索フィルター）と別々に定義すると語彙が乖離し、
 * 区の有無などの不一致で検索がヒットしなくなる（Issue #419）。
 * 単一の正（@beersalon/shared）を再エクスポートして両画面で共有する。
 */
export {
	SHIZUOKA_CITIES,
	SHIZUOKA_MUNICIPALITIES,
	SHIZUOKA_PREFECTURE,
	SHIZUOKA_TOWNS,
	type ShizuokaMunicipality,
} from "@beersalon/shared";
