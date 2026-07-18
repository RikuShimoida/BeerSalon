export interface SearchState {
	q: string;
	city: string;
	categories: string[];
	origin: string;
}

const normalizeText = (value: string | null | undefined): string =>
	(value ?? "").trim();

const normalizeCategories = (value: string | null | undefined): string[] =>
	normalizeText(value)
		.split(",")
		.map((category) => category.trim())
		.filter((category) => category.length > 0);

export function parseSearchParams(
	params: URLSearchParams | null | undefined,
): SearchState {
	return {
		q: normalizeText(params?.get("q")),
		city: normalizeText(params?.get("city")),
		categories: normalizeCategories(params?.get("cat")),
		origin: normalizeText(params?.get("origin")),
	};
}

export function buildSearchQueryString(state: {
	q?: string;
	city?: string;
	categories?: string[];
	origin?: string;
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

	const origin = normalizeText(state.origin);
	if (origin) {
		params.set("origin", origin);
	}

	return params.toString();
}
