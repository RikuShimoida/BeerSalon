"use client";

import { useState } from "react";
import { FavoriteBarCard } from "@/components/bar/favorite-bar-card";

interface FavoriteBar {
	id: string;
	createdAt: Date;
	bar: {
		id: string;
		name: string;
		prefecture: string;
		city: string;
		images: Array<{
			id: string;
			imageUrl: string;
			imageType: string;
		}>;
	};
}

interface FavoriteBarsClientProps {
	initialFavorites: FavoriteBar[];
}

export function FavoriteBarsClient({
	initialFavorites,
}: FavoriteBarsClientProps) {
	const [favorites, setFavorites] = useState(initialFavorites);

	const handleRemove = (barId: string) => {
		setFavorites((prev) => prev.filter((fav) => fav.bar.id !== barId));
	};

	if (favorites.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p className="mb-2">お気に入りのバーがありません</p>
				<p className="text-sm">
					気になるバーを見つけたら、お気に入りに登録してみましょう
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{favorites.map((favorite) => (
				<FavoriteBarCard
					key={favorite.bar.id}
					id={favorite.bar.id}
					name={favorite.bar.name}
					prefecture={favorite.bar.prefecture}
					city={favorite.bar.city}
					images={favorite.bar.images}
					onRemove={handleRemove}
				/>
			))}
		</div>
	);
}
