"use client";

import { Star } from "lucide-react";
import Link from "next/link";
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
			<div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
				<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-primary/60">
					<Star className="h-7 w-7" />
				</div>
				<p className="mb-1 font-medium text-heading">
					まだお気に入りがありません
				</p>
				<p className="mb-6 text-sm text-subtext">
					気になるお店を見つけたら、お気に入りに登録してみましょう
				</p>
				<Link
					href="/"
					className="inline-flex items-center rounded-full bg-gradient-to-r from-primary to-primary-strong px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
				>
					お店をさがす
				</Link>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
