import type { BarPin } from "@/lib/map/bar-pins";

// Why not: fitBounds/setCenter は google.maps に依存する命令的 API のため、そのままだと UT できない。
// ピン件数による分岐（fit / center / なし）だけを純粋関数に切り出し、テスト可能にする。
export type MapViewInstruction =
	| { type: "fit"; points: Array<{ lat: number; lng: number }> }
	| { type: "center"; center: { lat: number; lng: number } }
	| { type: "none" };

// 単一ピンを fitBounds に渡すと極端にズームインするため、1件は center 指定に分岐する。
export function resolveMapView(pins: BarPin[]): MapViewInstruction {
	if (pins.length === 0) {
		return { type: "none" };
	}
	if (pins.length === 1) {
		return {
			type: "center",
			center: { lat: pins[0].lat, lng: pins[0].lng },
		};
	}
	return {
		type: "fit",
		points: pins.map((pin) => ({ lat: pin.lat, lng: pin.lng })),
	};
}
