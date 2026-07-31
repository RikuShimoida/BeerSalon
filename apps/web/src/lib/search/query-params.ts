export interface SearchState {
	q: string;
	city: string;
	categories: string[];
	origins: string[];
}

const normalizeText = (value: string | null | undefined): string =>
	(value ?? "").trim();

// Why not: カテゴリと産地はどちらもカンマ区切りの複数値で表現するため、
// 分割・トリム・空要素除外の処理を種別ごとに重複させず1つに集約する。
// 産地の各要素は「国/地域」ペアだが、区切りはカンマのみのためスラッシュは保持される。
const normalizeCsvList = (value: string | null | undefined): string[] =>
	normalizeText(value)
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

export function parseSearchParams(
	params: URLSearchParams | null | undefined,
): SearchState {
	return {
		q: normalizeText(params?.get("q")),
		city: normalizeText(params?.get("city")),
		categories: normalizeCsvList(params?.get("cat")),
		origins: normalizeCsvList(params?.get("origin")),
	};
}

export function buildSearchQueryString(state: {
	q?: string;
	city?: string;
	categories?: string[];
	origins?: string[];
}): string {
	const params = new URLSearchParams();

	const q = normalizeText(state.q);
	if (q) {
		params.set("q", q);
	}

	const city = normalizeText(state.city);
	if (city) {
		params.set("city", city);
	}

	const categories = (state.categories ?? [])
		.map((category) => category.trim())
		.filter((category) => category.length > 0);
	if (categories.length > 0) {
		params.set("cat", categories.join(","));
	}

	const origins = (state.origins ?? [])
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);
	if (origins.length > 0) {
		params.set("origin", origins.join(","));
	}

	return params.toString();
}
