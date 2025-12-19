"use client";

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMapComponent,
} from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

interface BarLocation {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
}

interface GoogleMapProps {
	bars?: BarLocation[];
	defaultCenter?: { lat: number; lng: number };
	defaultZoom?: number;
}

export function GoogleMap({
	bars = [],
	defaultCenter = { lat: 35.6762, lng: 139.6503 }, // 東京駅をデフォルト
	defaultZoom = 12,
}: GoogleMapProps) {
	const [center, setCenter] = useState(defaultCenter);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const newCenter = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					setUserLocation(newCenter);
					setCenter(newCenter);
				},
				(error) => {
					console.warn("位置情報の取得に失敗しました:", error);
				},
			);
		}
	}, []);

	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	if (!apiKey) {
		return (
			<div className="glass-card rounded-2xl flex items-center justify-center h-64 md:h-80 modern-shadow overflow-hidden">
				<div className="text-center text-muted-foreground">
					<p className="text-sm font-medium tracking-wide">
						Google Maps APIキーが設定されていません
					</p>
					<p className="text-xs mt-1 tracking-wide">
						環境変数 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="glass-card rounded-2xl overflow-hidden modern-shadow h-64 md:h-80">
			<APIProvider apiKey={apiKey}>
				<GoogleMapComponent
					defaultCenter={center}
					defaultZoom={defaultZoom}
					mapId="beer-salon-map"
					className="w-full h-full"
					gestureHandling="greedy"
					disableDefaultUI={false}
				>
					{userLocation && (
						<AdvancedMarker position={userLocation} title="現在地" />
					)}
					{bars.map((bar) => (
						<AdvancedMarker
							key={bar.id}
							position={{ lat: bar.latitude, lng: bar.longitude }}
							title={bar.name}
						/>
					))}
				</GoogleMapComponent>
			</APIProvider>
		</div>
	);
}
