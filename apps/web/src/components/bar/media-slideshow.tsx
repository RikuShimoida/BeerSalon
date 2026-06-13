"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type MediaItem = {
	id: string;
	mediaType: string;
	imageUrl: string;
	imageType: string;
};

type MediaSlideshowProps = {
	media: MediaItem[];
};

export function MediaSlideshow({ media }: MediaSlideshowProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [fadeClass, setFadeClass] = useState("opacity-100");

	useEffect(() => {
		if (media.length <= 1) return;

		const interval = setInterval(() => {
			setFadeClass("opacity-0");

			setTimeout(() => {
				setCurrentIndex((prev) => (prev + 1) % media.length);
				setFadeClass("opacity-100");
			}, 500);
		}, 3000);

		return () => clearInterval(interval);
	}, [media.length]);

	if (media.length === 0) {
		return (
			<div className="w-full h-[40vh] bg-muted flex items-center justify-center">
				<p className="text-muted-foreground">画像がありません</p>
			</div>
		);
	}

	const currentMedia = media[currentIndex];

	return (
		<div className="relative w-full h-[40vh] bg-muted overflow-hidden">
			{currentMedia.mediaType === "video" ? (
				<video
					key={currentMedia.id}
					src={currentMedia.imageUrl}
					className={`w-full h-full object-cover transition-opacity duration-500 ${fadeClass}`}
					muted
					playsInline
				/>
			) : (
				<Image
					key={currentMedia.id}
					src={currentMedia.imageUrl}
					alt={`店舗${currentMedia.imageType}画像`}
					className={`w-full h-full object-cover transition-opacity duration-500 ${fadeClass}`}
					fill
					sizes="100vw"
					priority={currentIndex === 0}
				/>
			)}
		</div>
	);
}
