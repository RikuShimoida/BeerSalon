import { BarCard } from "./bar-card";

// ダミーデータ
const DUMMY_BARS = [
	{
		id: "1",
		name: "静岡クラフトビアバー",
		prefecture: "静岡県",
		city: "静岡市",
	},
	{
		id: "2",
		name: "Beer Garden Tokyo",
		prefecture: "東京都",
		city: "渋谷区",
	},
	{
		id: "3",
		name: "浜松ビール工房",
		prefecture: "静岡県",
		city: "浜松市",
	},
	{
		id: "4",
		name: "横浜クラフトビアハウス",
		prefecture: "神奈川県",
		city: "横浜市",
	},
];

export function BarList() {
	return (
		<div>
			<h2 className="text-2xl font-semibold text-foreground mb-6">店舗一覧</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{DUMMY_BARS.map((bar) => (
					<BarCard key={bar.id} {...bar} />
				))}
			</div>

			{DUMMY_BARS.length === 0 && (
				<div className="text-center py-12 text-muted-foreground">
					<p>店舗が見つかりませんでした</p>
				</div>
			)}
		</div>
	);
}
