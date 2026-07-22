export const SLIDE_DURATION_MS = 5000;

export function getNextIndex(currentIndex: number, mediaCount: number): number {
	if (mediaCount <= 0) return 0;
	return (currentIndex + 1) % mediaCount;
}

export function isVideoMedia(mediaType: string): boolean {
	return mediaType === "video";
}

// 単一メディアかつ動画のときだけ loop 再生し、静止させず注ぐ映像を提示し続ける。
export function shouldLoopVideo(
	mediaType: string,
	mediaCount: number,
): boolean {
	return isVideoMedia(mediaType) && mediaCount === 1;
}

export function shouldAutoSlide(mediaCount: number): boolean {
	return mediaCount > 1;
}
