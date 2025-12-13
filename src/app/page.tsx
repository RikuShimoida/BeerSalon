import { BarList } from "@/components/bar/bar-list";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { SearchForm } from "@/components/search/search-form";

export default function Home() {
	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="flex flex-col gap-6">
					{/* 検索セクション */}
					<SearchForm />

					{/* 地図エリア */}
					<MapPlaceholder />

					{/* 店舗一覧 */}
					<BarList />
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
