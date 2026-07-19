import { Clock } from "lucide-react";
import { getViewHistories } from "@/actions/bar";
import { ViewHistoryList } from "@/components/history/view-history-list";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function ViewHistoriesPage() {
	const viewHistories = await getViewHistories();

	return (
		<AuthenticatedLayout>
			<div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
				<h1 className="mb-6 font-mincho text-2xl font-bold text-heading">
					閲覧履歴
				</h1>

				{!viewHistories || viewHistories.length === 0 ? (
					<div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
						<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-primary/60">
							<Clock className="h-7 w-7" />
						</div>
						<p className="mb-1 font-medium text-heading">
							閲覧履歴はありません
						</p>
						<p className="text-sm text-subtext">
							店舗を閲覧すると、ここに履歴が表示されます
						</p>
					</div>
				) : (
					<ViewHistoryList histories={viewHistories} />
				)}
			</div>
		</AuthenticatedLayout>
	);
}
