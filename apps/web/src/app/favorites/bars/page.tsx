import { getFavoriteBars } from "@/actions/bar";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { FavoriteBarsClient } from "./favorite-bars-client";

export default async function FavoriteBarsPage() {
	const favoriteBars = await getFavoriteBars();

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
				<h1 className="text-2xl font-semibold text-foreground mb-6">
					お気に入りバー
				</h1>

				<FavoriteBarsClient initialFavorites={favoriteBars || []} />
			</div>
		</AuthenticatedLayout>
	);
}
