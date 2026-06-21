export interface SearchState {
	q: string;
	city: string;
	categories: string[];
	origin: string;
}

const normalizeText = (value: string | null | undefined): string =>
	(value ?? "").trim();

export function parseSearchParams(
	params: URLSearchParams | null | undefined,
): SearchState {
	return {
		q: normalizeText(params?.get("q")),
		city: normalizeText(params?.get("city")),
		categories: [],
		origin: "",
	};
}

export function buildSearchQueryString(state: {
	q?: string;
	city?: string;
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

	return params.toString();
}
