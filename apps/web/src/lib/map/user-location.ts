export interface LatLng {
	lat: number;
	lng: number;
}

// Why not: GoogleMap（親）と MapContent（子）で navigator.geolocation を二重取得していたため、
// 取得ロジックをこの純粋関数に集約し、親から1度だけ呼ぶ。UT で「1回だけ呼ばれる」ことを
// 検証できるよう、React に依存しない形（geolocation を引数で受け取る）で切り出す。
export function requestUserLocation(
	geolocation: Geolocation | undefined,
	onSuccess: (location: LatLng) => void,
	onError?: (error: GeolocationPositionError) => void,
): void {
	if (!geolocation) return;
	geolocation.getCurrentPosition(
		(position) => {
			onSuccess({
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			});
		},
		(error) => {
			console.warn("位置情報の取得に失敗しました:", error);
			onError?.(error);
		},
	);
}
