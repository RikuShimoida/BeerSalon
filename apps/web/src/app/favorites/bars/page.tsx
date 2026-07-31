import { getFavoriteBars } from "@/actions/bar";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { FavoriteBarsClient } from "./favorite-bars-client";

export default async function FavoriteBarsPage() {
	const favoriteBars = await getFavoriteBars();

	return (
		<AuthenticatedLayout>
			<div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
				<h1 className="mb-6 font-mincho text-2xl font-bold text-heading">
					お気に入りバー
				</h1>

				<FavoriteBarsClient initialFavorites={favoriteBars || []} />
			</div>
		</AuthenticatedLayout>
	);
}
