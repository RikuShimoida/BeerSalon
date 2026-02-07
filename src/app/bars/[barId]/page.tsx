import { notFound } from "next/navigation";
import { getBarDetail, isFavoriteBar, recordViewHistory } from "@/actions/bar";
import { BarTabs } from "@/components/bar/bar-tabs";
import { FavoriteButton } from "@/components/bar/favorite-button";
import { MediaSlideshow } from "@/components/bar/media-slideshow";
import { CouponsTab } from "@/components/bar/tabs/coupons-tab";
import { MenuTab } from "@/components/bar/tabs/menu-tab";
import { PostsTab } from "@/components/bar/tabs/posts-tab";
import { TopTab } from "@/components/bar/tabs/top-tab";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function BarDetailPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const { barId } = await params;

	const bar = await getBarDetail(barId);

	if (!bar) {
		notFound();
	}

	await recordViewHistory(barId);

	const initialIsFavorite = await isFavoriteBar(barId);

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto">
				<div className="bg-card rounded-lg shadow-md overflow-hidden">
					<div className="px-6 pt-6 pb-4">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h1 className="text-3xl font-semibold text-foreground">
									{bar.name}
								</h1>
							</div>
							<FavoriteButton
								barId={barId}
								initialIsFavorite={initialIsFavorite}
							/>
						</div>
					</div>

					<MediaSlideshow media={bar.barImages.slice(0, 5)} />

					<BarTabs>
						{{
							top: <TopTab bar={bar} />,
							menu: (
								<MenuTab beerMenus={bar.beerMenus} foodMenus={bar.foodMenus} />
							),
							posts: (
								<PostsTab posts={bar.posts} barId={barId} barName={bar.name} />
							),
							coupons: <CouponsTab coupons={bar.coupons} />,
						}}
					</BarTabs>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
