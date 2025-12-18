import { getViewHistories } from "@/actions/bar";
import { BarCard } from "@/components/bar/bar-card";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function ViewHistoriesPage() {
	const viewHistories = await getViewHistories();

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">閲覧履歴</h1>

				{!viewHistories || viewHistories.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<p className="mb-2">閲覧履歴はありません</p>
						<p className="text-sm">
							店舗を閲覧すると、ここに履歴が表示されます
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{viewHistories.map((history) => (
							<BarCard
								key={history.id}
								id={history.bar.id}
								name={history.bar.name}
								prefecture={history.bar.prefecture}
								city={history.bar.city}
								imageUrl={history.bar.imageUrl}
							/>
						))}
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	);
}
