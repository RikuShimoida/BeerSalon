import type { BarSummary } from "@/components/bar/bar-summary";

export interface BarPin {
	id: string;
	name: string;
	city: string;
	prefecture: string;
	lat: number;
	lng: number;
}

// Why not: latitude/longitude は DB 上 numeric のため文字列で渡ってくる。Google Maps の
// position は number 必須なので変換し、緯度経度未登録 (null) の店舗はピンを描画できないため除外する。
export function toBarPins(bars: BarSummary[]): BarPin[] {
	const pins: BarPin[] = [];
	for (const bar of bars) {
		if (bar.latitude == null || bar.longitude == null) continue;
		const lat = Number(bar.latitude);
		const lng = Number(bar.longitude);
		if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
		pins.push({
			id: bar.id,
			name: bar.name,
			city: bar.city,
			prefecture: bar.prefecture,
			lat,
			lng,
		});
	}
	return pins;
}
