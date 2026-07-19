"use client";

import { Beer, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { removeFavoriteBar } from "@/actions/bar";

interface FavoriteBarCardProps {
	id: string;
	name: string;
	prefecture: string;
	city: string;
	images: Array<{
		id: string;
		imageUrl: string;
		imageType: string;
	}>;
	onRemove: (barId: string) => void;
}

export function FavoriteBarCard({
	id,
	name,
	prefecture,
	city,
	images,
	onRemove,
}: FavoriteBarCardProps) {
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemoveFavorite = async (
		e: React.MouseEvent<HTMLButtonElement>,
	) => {
		e.preventDefault();

		if (isRemoving) return;

		setIsRemoving(true);

		try {
			await removeFavoriteBar(id);
			toast.success("お気に入りから削除しました");
			onRemove(id);
		} catch (error) {
			console.error("Failed to remove favorite:", error);
			toast.error("お気に入りの削除に失敗しました");
			setIsRemoving(false);
		}
	};

	const displayImage = images[0]?.imageUrl;

	return (
		<div className="group relative block overflow-hidden rounded-2xl border border-border bg-card modern-shadow transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
			<Link href={`/bars/${id}`}>
				<div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
					{displayImage ? (
						<Image
							src={displayImage}
							alt={name}
							fill
							className="object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep text-primary/40">
							<Beer className="h-14 w-14" />
						</div>
					)}
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-deep/40 to-transparent" />
				</div>

				<div className="p-4">
					<h3 className="mb-2 font-mincho text-[15px] font-bold text-heading">
						{name}
					</h3>
					<span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-subtext">
						<MapPin className="h-3 w-3 text-primary" />
						{prefecture} {city}
					</span>
				</div>
			</Link>

			<button
				type="button"
				onClick={handleRemoveFavorite}
				disabled={isRemoving}
				className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(15,11,6,0.6)] backdrop-blur-sm transition-colors hover:bg-[rgba(15,11,6,0.8)] disabled:opacity-50"
				aria-label="お気に入りから削除"
			>
				<Star className="h-5 w-5 fill-primary text-primary" />
			</button>
		</div>
	);
}
