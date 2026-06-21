"use client";

import { useEffect, useState } from "react";
import { getBars } from "@/actions/bar";
import { BarCard } from "./bar-card";
import { BarCardSkeleton } from "./bar-card-skeleton";

interface BarListProps {
	q?: string;
	city?: string;
	categories?: string[];
	origin?: string;
}

export function BarList({ q, city, categories, origin }: BarListProps) {
	const [bars, setBars] = useState<
		Array<{
			id: string;
			name: string;
			prefecture: string;
			city: string;
			imageUrl?: string;
		}>
	>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Why not: categories は配列のため参照同一性が毎レンダリングで変わる。
	// 依存配列に配列をそのまま渡すと無限ループの恐れがあるため、文字列化した値で比較する。
	const categoriesKey = (categories ?? []).join(",");

	useEffect(() => {
		const fetchBars = async () => {
			setIsLoading(true);
			const result = await getBars({
				q,
				city,
				categories: categoriesKey ? categoriesKey.split(",") : [],
				origin,
			});
			setBars(result);
			setIsLoading(false);
		};

		fetchBars();
	}, [q, city, categoriesKey, origin]);

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
					<BarCard key={bar.id} {...bar} />
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
