import {
	validateFacebookUrl,
	validateInstagramUrl,
	validateLineUrl,
	validateWebsiteUrl,
	validateXUrl,
} from "@/lib/validators";

/**
 * 店舗プロフィール入力フォーム（新規登録 / 編集）で共有する入力値の型。
 *
 * 数値項目（latitude/longitude）も state 表現に合わせ string とする。
 * Why not「latitude/longitude を number」: フォームの input は文字列を保持し、
 * 保存直前に validateCoordinates で数値化する既存フローに合わせるため。
 */
export interface BarProfileFields {
	name: string;
	description: string;
	access: string;
	phone_number: string;
	prefecture: string;
	city: string;
	address_line1: string;
	address_line2: string;
	latitude: string;
	longitude: string;
	website_url: string;
	instagram_url: string;
	x_url: string;
	facebook_url: string;
	line_url: string;
}

export const INITIAL_BAR_PROFILE_FIELDS: BarProfileFields = {
	name: "",
	description: "",
	access: "",
	phone_number: "",
	prefecture: "",
	city: "",
	address_line1: "",
	address_line2: "",
	latitude: "",
	longitude: "",
	website_url: "",
	instagram_url: "",
	x_url: "",
	facebook_url: "",
	line_url: "",
};

export interface OpeningHourInput {
	day_of_week: number;
	open_time: string;
	close_time: string;
	sort_order: number;
	is_closed: boolean;
}

export function createInitialOpeningHours(): OpeningHourInput[] {
	return Array.from({ length: 7 }, (_, day) => ({
		day_of_week: day,
		open_time: "",
		close_time: "",
		sort_order: 0,
		is_closed: false,
	}));
}

/**
 * 店舗プロフィールの SNS・ホームページ URL 群を、新規登録・編集フォーム共通の
 * 順序・フォールバック文言で一括検証する。
 *
 * 検証順は website → instagram → x → facebook → line で、最初に不正だった項目の
 * エラーを返す（既存フォームの逐次検証の順序・文言を踏襲）。
 *
 * Why not「validators.ts に同居」: validators.ts は URL 種別ごとの純粋な個別バリデータ群。
 * 「検証順・フォールバック文言・一括実行」というフォーム層固有の関心事は bar-form.ts に分離する。
 */
export function validateBarSnsUrls(fields: BarProfileFields): {
	isValid: boolean;
	error?: string;
} {
	if (fields.website_url) {
		const result = validateWebsiteUrl(fields.website_url);
		if (!result.isValid) {
			return {
				isValid: false,
				error: result.error || "ホームページURLの形式が正しくありません",
			};
		}
	}
	if (fields.instagram_url) {
		const result = validateInstagramUrl(fields.instagram_url);
		if (!result.isValid) {
			return {
				isValid: false,
				error: result.error || "Instagram URLの形式が正しくありません",
			};
		}
	}
	if (fields.x_url) {
		const result = validateXUrl(fields.x_url);
		if (!result.isValid) {
			return {
				isValid: false,
				error: result.error || "X URLの形式が正しくありません",
			};
		}
	}
	if (fields.facebook_url) {
		const result = validateFacebookUrl(fields.facebook_url);
		if (!result.isValid) {
			return {
				isValid: false,
				error: result.error || "Facebook URLの形式が正しくありません",
			};
		}
	}
	if (fields.line_url) {
		const result = validateLineUrl(fields.line_url);
		if (!result.isValid) {
			return {
				isValid: false,
				error: result.error || "LINE URLの形式が正しくありません",
			};
		}
	}

	return { isValid: true };
}
