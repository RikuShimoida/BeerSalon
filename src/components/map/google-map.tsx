"use client";

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMapComponent,
} from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { CITY_COORDINATES } from "@/lib/constants/city-coordinates";

interface BarLocation {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
}

interface GoogleMapProps {
	bars?: BarLocation[];
	city?: string;
	defaultZoom?: number;
}

export function GoogleMap({
	bars = [],
	city,
	defaultZoom = 12,
}: GoogleMapProps) {
	const [center, setCenter] = useState<{ lat: number; lng: number }>({
		lat: 34.9756,
		lng: 138.3833,
	});
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const hasSetUserLocation = useRef(false);

	useEffect(() => {
		if (!hasSetUserLocation.current && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const newCenter = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					setUserLocation(newCenter);
					if (!city) {
						setCenter(newCenter);
					}
					hasSetUserLocation.current = true;
				},
				(error) => {
					console.warn("位置情報の取得に失敗しました:", error);
					hasSetUserLocation.current = true;
				},
			);
		}
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
					center={center}
					zoom={defaultZoom}
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
