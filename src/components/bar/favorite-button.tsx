"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { addFavoriteBar, removeFavoriteBar } from "@/actions/bar";

interface FavoriteButtonProps {
	barId: string;
	initialIsFavorite: boolean;
}

export function FavoriteButton({
	barId,
	initialIsFavorite,
}: FavoriteButtonProps) {
	const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
	const [isLoading, setIsLoading] = useState(false);

	const handleToggleFavorite = async () => {
		setIsLoading(true);

		try {
			if (isFavorite) {
				await removeFavoriteBar(barId);
				setIsFavorite(false);
				alert("お気に入りから削除しました");
			} else {
				await addFavoriteBar(barId);
				setIsFavorite(true);
				alert("お気に入りに追加しました");
			}
		} catch (error) {
			console.error("Failed to toggle favorite:", error);
			alert("エラーが発生しました");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleToggleFavorite}
			disabled={isLoading}
			className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
		>
			<Star
				className={`w-6 h-6 transition-colors ${
					isFavorite
						? "fill-yellow-400 stroke-yellow-400"
						: "fill-none stroke-muted-foreground"
				}`}
			/>
		</button>
	);
}
