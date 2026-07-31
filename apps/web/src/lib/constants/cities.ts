/**
 * ユーザー画面の市町村フィルター用マスタ。
 *
 * Why not: web 独自の区付きリスト（「静岡市（葵区）」等）を持たない。
 * 店舗登録（管理画面）が保存する bars.city は区なし粒度（例:「静岡市」）で、
 * 区付きの値を検索フィルターが渡すと完全一致で永久にヒットしなかった（Issue #419）。
 * 検索側・登録側の語彙を単一の正（@beersalon/shared）へ統一する。
 */
import { SHIZUOKA_MUNICIPALITIES } from "@beersalon/shared";

export const SHIZUOKA_CITIES = SHIZUOKA_MUNICIPALITIES;
