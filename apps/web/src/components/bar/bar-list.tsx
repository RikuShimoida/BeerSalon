"use client";

import { BarCard } from "./bar-card";
import { BarCardSkeleton } from "./bar-card-skeleton";
import type { BarSummary } from "./bar-summary";

interface BarListProps {
	bars: BarSummary[];
	isLoading: boolean;
}

function ListHeader({ count }: { count: string }) {
	return (
		<div className="mb-5 flex items-end justify-between">
			<h2 className="font-mincho text-lg font-bold text-heading md:text-xl">
				近くのお店
			</h2>
			<span className="font-archivo text-sm font-medium text-subtext">
				{count}
			</span>
		</div>
	);
}

export function BarList({ bars, isLoading }: BarListProps) {
	if (isLoading) {
		return (
			<div className="animate-fade-in">
				<ListHeader count="... 件" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{Array.from({ length: 6 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have fixed order
						<BarCardSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="animate-fade-in">
			<ListHeader count={`${bars.length} 件`} />

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{bars.map((bar) => (
					<BarCard
						key={bar.id}
						id={bar.id}
						name={bar.name}
						prefecture={bar.prefecture}
						city={bar.city}
						imageUrl={bar.imageUrl}
					/>
				))}
			</div>

			{bars.length === 0 && (
				<div className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center text-subtext">
					<p>条件に合う店舗が見つかりませんでした</p>
				</div>
			)}
		</div>
	);
}
