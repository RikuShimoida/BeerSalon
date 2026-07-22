"use client";

import { ArrowLeft, Beer, MapPin, Share2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/bar/favorite-button";
import {
	getNextIndex,
	isVideoMedia,
	SLIDE_DURATION_MS,
	shouldAutoSlide,
	shouldLoopVideo,
} from "@/components/bar/hero-slider";

type MediaItem = {
	id: string;
	mediaType: string;
	imageUrl: string;
	imageType: string;
};

interface BarHeroProps {
	barId: string;
	name: string;
	prefecture: string;
	city: string;
	media: MediaItem[];
	initialIsFavorite: boolean;
}

export function BarHero({
	barId,
	name,
	prefecture,
	city,
	media,
	initialIsFavorite,
}: BarHeroProps) {
	const router = useRouter();
	const [currentIndex, setCurrentIndex] = useState(0);
	const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

	const goNext = useCallback(() => {
		setCurrentIndex((prev) => getNextIndex(prev, media.length));
	}, [media.length]);

	const autoSlide = shouldAutoSlide(media.length);
	const currentMedia = media[currentIndex];

	// アクティブなメディアのみを再生し、非アクティブ動画は一時停止して先頭へ戻す。
	// Why not: 全動画を同時再生するとモバイルで負荷・音源競合が出るため、1本だけ再生する。
	useEffect(() => {
		videoRefs.current.forEach((video, index) => {
			if (!video) return;
			if (index === currentIndex) {
				video.currentTime = 0;
				video.play().catch(() => {
					// Why not: 自動再生がブラウザ方針で拒否されても致命的でないため握りつぶす
				});
			} else {
				video.pause();
			}
		});
	}, [currentIndex]);

	// オートスライドのタイマー。動画は onEnded と 5秒 の早い方で次へ進むため、
	// ここでは上限としての 5秒タイマーのみを張る（画像・動画共通）。
	// currentIndex を依存に持つことで、ドット手動タップで表示が変わるたびに
	// タイマーを張り直し、直前の残タイマーによる早期遷移を防ぐ。
	useEffect(() => {
		if (!autoSlide) return;
		const timer = setTimeout(() => {
			setCurrentIndex(getNextIndex(currentIndex, media.length));
		}, SLIDE_DURATION_MS);
		return () => clearTimeout(timer);
	}, [autoSlide, currentIndex, media.length]);

	const handleShare = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title: name, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			toast.success("リンクをコピーしました");
		} catch {
			// Why not: ユーザーがネイティブ共有シートを閉じただけの AbortError を
			// エラー表示しないよう、失敗トーストは出さない
		}
	};

	return (
		<div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-surface-deep">
			{currentMedia ? (
				// 全メディアを重ねて描画し、アクティブのみ不透明にしてクロスフェードする。
				// Why not: 単一要素の差し替えだと退場中の旧メディアが即消えてフェードにならないため。
				media.map((item, index) => {
					const isActive = index === currentIndex;
					const fadeClass = `absolute inset-0 transition-opacity duration-700 ${
						isActive ? "opacity-100" : "opacity-0"
					}`;
					return isVideoMedia(item.mediaType) ? (
						<div key={item.id} className={fadeClass}>
							<video
								ref={(el) => {
									videoRefs.current[index] = el;
								}}
								src={item.imageUrl}
								className="h-full w-full object-cover"
								muted
								playsInline
								autoPlay={isActive}
								loop={shouldLoopVideo(item.mediaType, media.length)}
								onEnded={autoSlide ? goNext : undefined}
							/>
						</div>
					) : (
						<div key={item.id} className={fadeClass}>
							<Image
								src={item.imageUrl}
								alt={`${name}の画像`}
								fill
								sizes="100vw"
								priority={index === 0}
								className="object-cover"
							/>
						</div>
					);
				})
			) : (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep text-primary/30">
					<Beer className="h-20 w-20" />
				</div>
			)}

			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-deep via-surface-deep/40 to-surface-deep/50" />

			<div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
				<button
					type="button"
					onClick={() => router.back()}
					aria-label="前の画面に戻る"
					className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-surface-deep/60 text-heading backdrop-blur-sm transition-colors hover:bg-surface-deep/80"
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleShare}
						aria-label="共有する"
						className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-surface-deep/60 text-heading backdrop-blur-sm transition-colors hover:bg-surface-deep/80"
					>
						<Share2 className="h-5 w-5" />
					</button>
					<FavoriteButton
						barId={barId}
						initialIsFavorite={initialIsFavorite}
						variant="hero"
					/>
				</div>
			</div>

			{media.length > 1 && (
				<div className="absolute inset-x-0 bottom-20 z-10 flex justify-center gap-1.5">
					{media.map((item, index) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setCurrentIndex(index)}
							aria-label={`画像${index + 1}を表示`}
							className={`h-1.5 rounded-full transition-all ${
								index === currentIndex
									? "w-5 bg-primary"
									: "w-1.5 bg-heading/40"
							}`}
						/>
					))}
				</div>
			)}

			<div className="absolute inset-x-0 bottom-0 p-5">
				<div className="mx-auto max-w-7xl">
					<h1 className="font-mincho text-2xl font-bold text-heading md:text-3xl">
						{name}
					</h1>
					<span className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-surface-deep/70 px-2.5 py-1 text-xs text-subtext backdrop-blur-sm">
						<MapPin className="h-3 w-3 text-primary" />
						{prefecture} {city}
					</span>
				</div>
			</div>
		</div>
	);
}
