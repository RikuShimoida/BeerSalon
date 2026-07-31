"use client";

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMapComponent,
	InfoWindow,
	useMap,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BarSummary } from "@/components/bar/bar-summary";
import { CITY_COORDINATES } from "@/lib/constants/city-coordinates";
import { type BarPin, toBarPins } from "@/lib/map/bar-pins";
import { resolveMapView } from "@/lib/map/map-view";
import { type LatLng, requestUserLocation } from "@/lib/map/user-location";

// fitBounds で全ピンを内包表示する際、ピンが地図の端に貼り付かないよう余白を確保する。
const FIT_BOUNDS_PADDING = 48;

interface GoogleMapProps {
	city?: string;
	bars: BarSummary[];
	defaultZoom?: number;
}

function MapContent({
	pins,
	userLocation,
	fallbackCenter,
	fallbackZoom,
}: {
	pins: BarPin[];
	userLocation: LatLng | null;
	fallbackCenter: { lat: number; lng: number };
	fallbackZoom: number;
}) {
	const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
	const map = useMap();

	const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

	// Why not: center/zoom を <Map> の props で controlled にすると、市町村代表座標1点に固定され
	// ピン群がビューポート外にはみ出す。fitBounds はブラウザ API のため useMap 経由で命令的に呼ぶ。
	// pins の同一性ではなく座標並びの変化に反応させるため、依存キーを座標文字列に落とす。
	const pinsKey = pins.map((pin) => `${pin.lat},${pin.lng}`).join("|");
	const { lat: fallbackLat, lng: fallbackLng } = fallbackCenter;
	// biome-ignore lint/correctness/useExhaustiveDependencies: pinsKey が pins の座標変化を表すため pins 自体は依存に含めない
	useEffect(() => {
		if (!map) return;
		const view = resolveMapView(pins);
		if (view.type === "fit") {
			const bounds = new google.maps.LatLngBounds();
			for (const point of view.points) {
				bounds.extend(point);
			}
			map.fitBounds(bounds, FIT_BOUNDS_PADDING);
			return;
		}
		if (view.type === "center") {
			map.setCenter(view.center);
			map.setZoom(fallbackZoom);
			return;
		}
		// ピン0件: ピンに合わせようがないため、市町村代表座標 or 現在地へ寄せる。
		map.setCenter({ lat: fallbackLat, lng: fallbackLng });
		map.setZoom(fallbackZoom);
	}, [map, pinsKey, fallbackLat, fallbackLng, fallbackZoom]);

	return (
		<>
			{userLocation && (
				<AdvancedMarker position={userLocation} title="現在地" />
			)}
			{pins.map((pin) => (
				<AdvancedMarker
					key={pin.id}
					position={{ lat: pin.lat, lng: pin.lng }}
					title={pin.name}
					onClick={() => setSelectedPinId(pin.id)}
				/>
			))}
			{selectedPin && (
				<InfoWindow
					position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
					onCloseClick={() => setSelectedPinId(null)}
				>
					{/* Why not テーマのダークトークン: InfoWindow の吹き出しは Google 管理の白背景で
					    描画されるため、明色テキストのトークンを当てると白地に白で見えなくなる。
					    白地で可読なブランドカラー（濃茶見出し・アンバーリンク）を明示指定する。 */}
					<div className="p-2 font-sans">
						<h3 className="mb-1 font-mincho text-base font-bold text-[#20160a]">
							{selectedPin.name}
						</h3>
						<p className="mb-2 text-xs text-[#6b5535]">
							{selectedPin.prefecture} {selectedPin.city}
						</p>
						<Link
							href={`/bars/${selectedPin.id}`}
							className="text-xs font-semibold text-[#c47f28] underline"
						>
							店舗詳細を見る
						</Link>
					</div>
				</InfoWindow>
			)}
		</>
	);
}

export function GoogleMap({ city, bars, defaultZoom = 12 }: GoogleMapProps) {
	const [center, setCenter] = useState<{ lat: number; lng: number }>({
		lat: 34.9756,
		lng: 138.3833,
	});
	const [userLocation, setUserLocation] = useState<LatLng | null>(null);
	const hasSetUserLocation = useRef(false);

	useEffect(() => {
		if (hasSetUserLocation.current) return;
		requestUserLocation(
			navigator.geolocation,
			(location) => {
				setUserLocation(location);
				if (!city) {
					setCenter(location);
				}
				hasSetUserLocation.current = true;
			},
			() => {
				hasSetUserLocation.current = true;
			},
		);
	}, [city]);

	useEffect(() => {
		if (city && CITY_COORDINATES[city]) {
			setCenter(CITY_COORDINATES[city]);
		} else if (!city && userLocation) {
			setCenter(userLocation);
		}
	}, [city, userLocation]);

	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	if (!apiKey) {
		return (
			<div className="flex h-64 items-center justify-center overflow-hidden rounded-[18px] border border-border bg-card modern-shadow md:h-full md:min-h-80">
				<div className="text-center text-subtext">
					<p className="text-sm font-medium tracking-wide">
						Google Maps APIキーが設定されていません
					</p>
					<p className="mt-1 text-xs tracking-wide">
						環境変数 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
					</p>
				</div>
			</div>
		);
	}

	const pins = toBarPins(bars);

	return (
		<div className="h-64 overflow-hidden rounded-[18px] border border-border modern-shadow md:h-full md:min-h-80">
			<APIProvider apiKey={apiKey}>
				<GoogleMapComponent
					defaultCenter={center}
					defaultZoom={defaultZoom}
					mapId="beer-salon-map"
					className="w-full h-full"
					gestureHandling="greedy"
					disableDefaultUI={false}
				>
					<MapContent
						pins={pins}
						userLocation={userLocation}
						fallbackCenter={center}
						fallbackZoom={defaultZoom}
					/>
				</GoogleMapComponent>
			</APIProvider>
		</div>
	);
}
