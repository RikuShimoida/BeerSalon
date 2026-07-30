import type { BarDashboardMetrics } from "@/lib/dashboard-metrics";

interface DashboardProps {
	metrics: BarDashboardMetrics;
}

interface MetricCard {
	label: string;
	value: number;
	description: string;
}

export default function Dashboard({ metrics }: DashboardProps) {
	const cards: MetricCard[] = [
		{
			label: "店舗ページ閲覧数",
			value: metrics.viewCount,
			description: "あなたの店舗ページを見たユーザー数",
		},
		{
			label: "お気に入り登録数",
			value: metrics.favoriteCount,
			description: "店舗をお気に入り登録したユーザー数",
		},
		{
			label: "記事いいね数",
			value: metrics.articleLikeCount,
			description: "店舗の記事に付いたいいねの合計",
		},
		{
			label: "タグ付け投稿数",
			value: metrics.postCount,
			description: "店舗にタグ付けされたユーザー投稿数",
		},
	];

	return (
		<section className="p-6" aria-labelledby="dashboard-heading">
			<h1
				id="dashboard-heading"
				className="text-2xl font-bold text-gray-900 mb-6"
			>
				ダッシュボード
			</h1>
			<dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{cards.map((card) => (
					<div
						key={card.label}
						className="bg-white border border-gray-200 rounded-lg p-6"
					>
						<dt className="text-sm font-medium text-gray-500">{card.label}</dt>
						<dd className="mt-2 text-3xl font-bold text-gray-900">
							{card.value.toLocaleString("ja-JP")}
						</dd>
						<p className="mt-2 text-xs text-gray-400">{card.description}</p>
					</div>
				))}
			</dl>
		</section>
	);
}
