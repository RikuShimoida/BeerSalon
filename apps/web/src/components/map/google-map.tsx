"use client";

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMapComponent,
	InfoWindow,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BarSummary } from "@/components/bar/bar-summary";
import { CITY_COORDINATES } from "@/lib/constants/city-coordinates";
import { type BarPin, toBarPins } from "@/lib/map/bar-pins";

interface GoogleMapProps {
	city?: string;
	bars: BarSummary[];
	defaultZoom?: number;
}

function MapContent({ pins }: { pins: BarPin[] }) {
	const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const hasSetUserLocation = useRef(false);

	useEffect(() => {
		if (!hasSetUserLocation.current && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setUserLocation({
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					});
					hasSetUserLocation.current = true;
				},
				(error) => {
					console.warn("位置情報の取得に失敗しました:", error);
					hasSetUserLocation.current = true;
				},
			);
		}
	}, []);

	const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

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
					<div className="p-2">
						<h3 className="font-bold text-base mb-1">{selectedPin.name}</h3>
						<p className="text-xs text-gray-600 mb-2">
							{selectedPin.prefecture} {selectedPin.city}
						</p>
						<Link
							href={`/bars/${selectedPin.id}`}
							className="text-xs font-semibold text-blue-600 underline"
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

	const pins = toBarPins(bars);

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
					<MapContent pins={pins} />
				</GoogleMapComponent>
			</APIProvider>
		</div>
	);
}
