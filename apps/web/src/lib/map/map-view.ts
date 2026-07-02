import type { BarPin } from "@/lib/map/bar-pins";

// Why not: fitBounds/setCenter は google.maps に依存する命令的 API のため、そのままだと UT できない。
// ピン件数による分岐（fit / center / なし）だけを純粋関数に切り出し、テスト可能にする。
export type MapViewInstruction =
	| { type: "fit"; points: Array<{ lat: number; lng: number }> }
	| { type: "center"; center: { lat: number; lng: number } }
	| { type: "none" };

// 単一ピンや全ピンが同一座標のケースを fitBounds に渡すと面積ゼロの bounds となり極端にズームインするため、
// 座標を一意に畳み込んだ結果が1点なら center 指定に分岐する。
export function resolveMapView(pins: BarPin[]): MapViewInstruction {
	if (pins.length === 0) {
		return { type: "none" };
	}
	const uniquePoints = Array.from(
		new Map(
			pins.map((pin) => [
				`${pin.lat},${pin.lng}`,
				{ lat: pin.lat, lng: pin.lng },
			]),
		).values(),
	);
	// Why not: 畳み込み後は必ず1件以上（pins が空でないため）なので、uniquePoints[0] は常に存在する。
	if (uniquePoints.length === 1) {
		return {
			type: "center",
			center: uniquePoints[0],
		};
	}
	return {
		type: "fit",
		points: uniquePoints,
	};
}
