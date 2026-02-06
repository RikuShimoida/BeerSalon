"use client";

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMapComponent,
	InfoWindow,
	useMap,
} from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { CITY_COORDINATES } from "@/lib/constants/city-coordinates";

interface PlaceResult {
	place_id: string;
	name: string;
	geometry?: {
		location?: google.maps.LatLng;
	};
	formatted_address?: string;
	vicinity?: string;
}

interface GoogleMapProps {
	city?: string;
	defaultZoom?: number;
}

function MapContent({ city }: { city?: string }) {
	const map = useMap();
	const [places, setPlaces] = useState<PlaceResult[]>([]);
	const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
	const [center, setCenter] = useState<{ lat: number; lng: number }>({
		lat: 34.9756,
		lng: 138.3833,
	});
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const hasSetUserLocation = useRef(false);
	const hasSearched = useRef(false);

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
			hasSearched.current = false;
		} else if (!city && userLocation) {
			setCenter(userLocation);
			hasSearched.current = false;
		}
	}, [city, userLocation]);

	useEffect(() => {
		if (!map || hasSearched.current) return;

		const service = new google.maps.places.PlacesService(map);
		const searchLocation =
			city && CITY_COORDINATES[city]
				? CITY_COORDINATES[city]
				: userLocation || center;

		const request: google.maps.places.PlaceSearchRequest = {
			location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng),
			radius: 50000,
			keyword: "クラフトビール",
		};

		service.nearbySearch(request, (results, status) => {
			if (status === google.maps.places.PlacesServiceStatus.OK && results) {
				setPlaces(results as PlaceResult[]);
				hasSearched.current = true;
			} else {
				console.warn("Places API search failed:", status);
				setPlaces([]);
			}
		});
	}, [map, city, userLocation, center]);

	return (
		<>
			{userLocation && (
				<AdvancedMarker position={userLocation} title="現在地" />
			)}
			{places.map((place) => {
				const lat = place.geometry?.location?.lat();
				const lng = place.geometry?.location?.lng();
				if (!lat || !lng) return null;

				return (
					<AdvancedMarker
						key={place.place_id}
						position={{ lat, lng }}
						title={place.name}
						onClick={() => setSelectedPlace(place)}
					/>
				);
			})}
			{selectedPlace?.geometry?.location && (
				<InfoWindow
					position={{
						lat: selectedPlace.geometry.location.lat(),
						lng: selectedPlace.geometry.location.lng(),
					}}
					onCloseClick={() => setSelectedPlace(null)}
				>
					<div className="p-2">
						<h3 className="font-bold text-base mb-1">{selectedPlace.name}</h3>
						<p className="text-xs text-gray-600 mb-2">
							{selectedPlace.vicinity || selectedPlace.formatted_address}
						</p>
					</div>
				</InfoWindow>
			)}
		</>
	);
}

export function GoogleMap({ city, defaultZoom = 12 }: GoogleMapProps) {
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
			<APIProvider apiKey={apiKey} libraries={["places"]}>
				<GoogleMapComponent
					center={center}
					zoom={defaultZoom}
					mapId="beer-salon-map"
					className="w-full h-full"
					gestureHandling="greedy"
					disableDefaultUI={false}
				>
					<MapContent city={city} />
				</GoogleMapComponent>
			</APIProvider>
		</div>
	);
}
