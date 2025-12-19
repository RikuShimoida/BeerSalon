import { getBars } from "@/actions/bar";
import { BarCard } from "./bar-card";

export async function BarList() {
	const bars = await getBars();

	return (
		<div className="animate-fade-in">
			<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">
				店舗一覧
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{bars.map((bar) => (
					<BarCard key={bar.id} {...bar} />
				))}
			</div>

			{bars.length === 0 && (
				<div className="text-center py-12 text-muted-foreground">
					<p className="tracking-wide">店舗が見つかりませんでした</p>
				</div>
			)}
		</div>
	);
}
