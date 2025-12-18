import { getFavoriteBars } from "@/actions/bar";
import { FavoriteBarsClient } from "./favorite-bars-client";

export default async function FavoriteBarsPage() {
	const favoriteBars = await getFavoriteBars();

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">
					お気に入りバー
				</h1>

				<FavoriteBarsClient initialFavorites={favoriteBars || []} />
			</div>
		</div>
	);
}
