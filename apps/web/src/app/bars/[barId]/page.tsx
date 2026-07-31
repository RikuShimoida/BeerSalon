import { PenSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBarDetail, isFavoriteBar, recordViewHistory } from "@/actions/bar";
import { BarHero } from "@/components/bar/bar-hero";
import { BarTabs } from "@/components/bar/bar-tabs";
import { ArticlesTab } from "@/components/bar/tabs/articles-tab";
import { CouponsTab } from "@/components/bar/tabs/coupons-tab";
import { EventsTab } from "@/components/bar/tabs/events-tab";
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
			<div className="pb-20 md:pb-0">
				<BarHero
					barId={barId}
					name={bar.name}
					prefecture={bar.prefecture}
					city={bar.city}
					media={bar.barImages
						.filter((img) => img.imageType === "slider")
						.slice(0, 5)}
					initialIsFavorite={initialIsFavorite}
				/>

				<div className="mx-auto max-w-7xl">
					<BarTabs>
						{{
							top: <TopTab bar={bar} />,
							menu: (
								<MenuTab beerMenus={bar.beerMenus} foodMenus={bar.foodMenus} />
							),
							posts: (
								<PostsTab posts={bar.posts} barId={barId} barName={bar.name} />
							),
							articles: <ArticlesTab articles={bar.articles} />,
							coupons: <CouponsTab coupons={bar.coupons} />,
							events: <EventsTab events={bar.events} />,
						}}
					</BarTabs>
				</div>

				<div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-surface-deep/95 p-3 backdrop-blur-md md:hidden">
					<Link
						href={`/posts/new?barId=${barId}`}
						className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
					>
						<PenSquare className="h-4 w-4" />
						このお店に投稿する
					</Link>
				</div>

				<div className="mx-auto hidden max-w-7xl px-4 pb-8 md:block">
					<Link
						href={`/posts/new?barId=${barId}`}
						className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
					>
						<PenSquare className="h-4 w-4" />
						このお店に投稿する
					</Link>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
