import { notFound } from "next/navigation";
import { getBarDetail } from "@/actions/bar";
import { BarTabs } from "@/components/bar/bar-tabs";
import { ArticlesTab } from "@/components/bar/tabs/articles-tab";
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

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							{bar.name}
						</h1>
						<p className="text-gray-600">
							{bar.prefecture} {bar.city}
						</p>
					</div>

					<BarTabs>
						{{
							top: <TopTab bar={bar} />,
							menu: (
								<MenuTab beerMenus={bar.beerMenus} foodMenus={bar.foodMenus} />
							),
							posts: <PostsTab posts={bar.posts} />,
							articles: <ArticlesTab articles={bar.articles} />,
							coupons: <CouponsTab coupons={bar.coupons} />,
						}}
					</BarTabs>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
