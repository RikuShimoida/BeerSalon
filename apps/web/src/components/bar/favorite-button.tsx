"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { addFavoriteBar, removeFavoriteBar } from "@/actions/bar";

interface FavoriteButtonProps {
	barId: string;
	initialIsFavorite: boolean;
	variant?: "hero" | "plain";
}

export function FavoriteButton({
	barId,
	initialIsFavorite,
	variant = "plain",
}: FavoriteButtonProps) {
	const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
	const [isLoading, setIsLoading] = useState(false);

	const handleToggleFavorite = async () => {
		setIsLoading(true);

		try {
			if (isFavorite) {
				await removeFavoriteBar(barId);
				setIsFavorite(false);
				toast.success("お気に入りから削除しました");
			} else {
				await addFavoriteBar(barId);
				setIsFavorite(true);
				toast.success("お気に入りに追加しました");
			}
		} catch (error) {
			console.error("Failed to toggle favorite:", error);
			toast.error("エラーが発生しました");
		} finally {
			setIsLoading(false);
		}
	};

	const containerClass =
		variant === "hero"
			? "flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-surface-deep/60 backdrop-blur-sm transition-colors hover:bg-surface-deep/80 disabled:opacity-50 disabled:cursor-not-allowed"
			: "p-2 rounded-full hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<button
			type="button"
			onClick={handleToggleFavorite}
			disabled={isLoading}
			className={containerClass}
			aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
			aria-pressed={isFavorite}
		>
			<Star
				className={`h-5 w-5 transition-colors ${
					isFavorite
						? "fill-primary stroke-primary"
						: "fill-none stroke-subtext"
				}`}
			/>
		</button>
	);
}
