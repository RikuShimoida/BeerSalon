export interface DirectionsTarget {
	prefecture: string;
	city: string;
	addressLine1: string;
	addressLine2: string | null;
	latitude: string | null | undefined;
	longitude: string | null | undefined;
}

export interface DirectionsUrls {
	apple: string;
	google: string;
}

// Why not: Number("") は 0 を返し空文字だと緯度0/経度0（ギニア湾沖）を指してしまうため、
// bar-pins.ts と同じく null/空文字/NaN を未登録扱いにして座標を採用しない。
function toValidCoords(
	latitude: string | null | undefined,
	longitude: string | null | undefined,
): { lat: number; lng: number } | null {
	if (latitude == null || longitude == null) return null;
	if (latitude === "" || longitude === "") return null;
	const lat = Number(latitude);
	const lng = Number(longitude);
	if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
	return { lat, lng };
}

function buildAddress(target: DirectionsTarget): string {
	return `${target.prefecture}${target.city}${target.addressLine1}${
		target.addressLine2 ? ` ${target.addressLine2}` : ""
	}`.trim();
}

// Why not: comgooglemaps:// スキームはアプリ未インストール時に何も起きず失敗するため、
// アプリが無ければブラウザにフォールバックする https ユニバーサルリンクを使う。iOS の
// maps.apple.com は標準マップアプリ、google.com/maps は Google マップアプリ/ブラウザで開く。
export function buildDirectionsUrls(target: DirectionsTarget): DirectionsUrls {
	const coords = toValidCoords(target.latitude, target.longitude);
	// Why not: 座標があれば住所文字列の表記ゆれ（番地の全角半角など）に依存せず正確に
	// 目的地を指せるため座標を優先する。座標未登録時のみ住所文字列にフォールバックする。
	const destination = coords
		? `${coords.lat},${coords.lng}`
		: buildAddress(target);
	const encoded = encodeURIComponent(destination);

	return {
		apple: `https://maps.apple.com/?daddr=${encoded}`,
		google: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
	};
}

export function hasDirectionsTarget(target: DirectionsTarget): boolean {
	if (toValidCoords(target.latitude, target.longitude)) return true;
	return buildAddress(target) !== "";
}
