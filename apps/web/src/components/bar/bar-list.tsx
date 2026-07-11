"use client";

import { BarCard } from "./bar-card";
import { BarCardSkeleton } from "./bar-card-skeleton";
import type { BarSummary } from "./bar-summary";

interface BarListProps {
	bars: BarSummary[];
	isLoading: boolean;
}

export function BarList({ bars, isLoading }: BarListProps) {
	if (isLoading) {
		return (
			<div className="animate-fade-in">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-lg font-bold text-foreground">近くのお店</h2>
					<span className="text-sm font-semibold text-muted-foreground">
						...件
					</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-lg font-bold text-foreground">近くのお店</h2>
				<span className="text-sm font-semibold text-muted-foreground">
					{bars.length}件
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
				<div className="text-center py-12 text-muted-foreground">
					<p>店舗が見つかりませんでした</p>
				</div>
			)}
		</div>
	);
}
