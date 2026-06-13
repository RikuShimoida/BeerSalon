"use client";

import { MapPin, Star } from "lucide-react";
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
		<div className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden relative">
			<Link href={`/bars/${id}`}>
				<div className="aspect-video bg-gray-200 relative">
					{displayImage ? (
						<Image
							src={displayImage}
							alt={name}
							fill
							className="object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400">
							<MapPin className="w-12 h-12" />
						</div>
					)}
				</div>

				<div className="p-4">
					<h3 className="font-bold text-lg text-gray-900 mb-2">{name}</h3>
					<p className="text-sm text-gray-600">
						{prefecture} {city}
					</p>
				</div>
			</Link>

			<button
				type="button"
				onClick={handleRemoveFavorite}
				disabled={isRemoving}
				className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors disabled:opacity-50"
				aria-label="お気に入りから削除"
			>
				<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
			</button>
		</div>
	);
}
