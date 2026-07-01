export function validateInstagramUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/.+/i;
	if (!instagramUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"Instagram URLの形式が正しくありません。https://instagram.com/ または https://www.instagram.com/ で始まるURLを入力してください",
		};
	}

	return { isValid: true };
}

export function validateXUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const xUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i;
	if (!xUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"X（Twitter）のURLはhttps://twitter.com/ または https://x.com/ で始まる必要があります",
		};
	}

	return { isValid: true };
}

export function validateFacebookUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const facebookUrlPattern = /^https:\/\/(www\.|m\.)?facebook\.com\/.+/i;
	if (!facebookUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"正しいFacebook URLを入力してください（例: https://www.facebook.com/yourpage）",
		};
	}

	return { isValid: true };
}

export function validateLineUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const lineUrlPattern =
		/^https:\/\/(line\.me|lin\.ee|page\.line\.me|liff\.line\.me)\/.+/i;
	if (!lineUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"LINE URLの形式が正しくありません。line.me, lin.ee, page.line.me, liff.line.me のURLを入力してください",
		};
	}

	return { isValid: true };
}

export type ArticleStatus = "draft" | "published" | "scheduled";

export const ARTICLE_STATUSES: ArticleStatus[] = [
	"draft",
	"published",
	"scheduled",
];

export function isArticleStatus(value: unknown): value is ArticleStatus {
	return (
		typeof value === "string" && (ARTICLE_STATUSES as string[]).includes(value)
	);
}

/**
 * 記事の status / published_at を保存値へ正規化する。
 *
 * - draft: 公開日時は持たない（null）
 * - published: 指定された published_at を尊重し、無ければ now（登録時の既存挙動を踏襲）
 * - scheduled: published_at 必須かつ未来日時のみ許容
 *
 * `now` は呼び出し側から渡してテスト容易性を確保する。
 */
export function resolveArticlePublishing(
	status: unknown,
	publishedAtInput: string | null | undefined,
	now: Date,
):
	| { isValid: true; status: ArticleStatus; published_at: string | null }
	| { isValid: false; error: string } {
	if (!isArticleStatus(status)) {
		return {
			isValid: false,
			error:
				"status は draft / published / scheduled のいずれかを指定してください",
		};
	}

	if (status === "draft") {
		return { isValid: true, status, published_at: null };
	}

	if (status === "published") {
		const publishedAt = publishedAtInput
			? new Date(publishedAtInput).toISOString()
			: now.toISOString();
		return { isValid: true, status, published_at: publishedAt };
	}

	if (!publishedAtInput) {
		return {
			isValid: false,
			error: "予約公開には公開日時を指定してください",
		};
	}

	const scheduledAt = new Date(publishedAtInput);
	if (Number.isNaN(scheduledAt.getTime())) {
		return { isValid: false, error: "公開日時の形式が正しくありません" };
	}
	if (scheduledAt.getTime() <= now.getTime()) {
		return {
			isValid: false,
			error: "予約公開の公開日時は未来の日時を指定してください",
		};
	}

	return { isValid: true, status, published_at: scheduledAt.toISOString() };
}

export function validateWebsiteUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const websiteUrlPattern = /^https?:\/\/.+/i;
	if (!websiteUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"ホームページURLの形式が正しくありません。http:// または https:// で始まるURLを入力してください",
		};
	}

	return { isValid: true };
}

function validateCoordinate(
	value: string | number | null | undefined,
	min: number,
	max: number,
	label: string,
): { isValid: boolean; error?: string; value: number | null } {
	if (value === null || value === undefined || value === "") {
		return { isValid: true, value: null };
	}

	const parsed = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(parsed)) {
		return {
			isValid: false,
			error: `${label}は数値で入力してください`,
			value: null,
		};
	}

	if (parsed < min || parsed > max) {
		return {
			isValid: false,
			error: `${label}は${min}〜${max}の範囲で入力してください`,
			value: null,
		};
	}

	return { isValid: true, value: parsed };
}

/**
 * 緯度・経度を検証し、保存用の数値（未入力は null）へ正規化する。
 *
 * 緯度・経度はそれぞれ独立した任意項目とする。
 * Why not「両方揃える」制約: 他の Phase 2 項目（住所・SNS 等）が各々独立して任意入力である流儀に合わせ、
 * 片方だけの入力も許容する。
 */
export function validateCoordinates(
	latitude: string | number | null | undefined,
	longitude: string | number | null | undefined,
):
	| { isValid: true; latitude: number | null; longitude: number | null }
	| { isValid: false; error: string } {
	const lat = validateCoordinate(latitude, -90, 90, "緯度");
	if (!lat.isValid) {
		return { isValid: false, error: lat.error as string };
	}

	const lng = validateCoordinate(longitude, -180, 180, "経度");
	if (!lng.isValid) {
		return { isValid: false, error: lng.error as string };
	}

	return { isValid: true, latitude: lat.value, longitude: lng.value };
}
