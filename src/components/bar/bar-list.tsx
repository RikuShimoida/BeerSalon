"use client";

import { useEffect, useState } from "react";
import { getBars } from "@/actions/bar";
import { BarCard } from "./bar-card";

interface BarListProps {
	prefecture?: string;
	category?: string;
}

export function BarList({ prefecture, category }: BarListProps) {
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

	useEffect(() => {
		const fetchBars = async () => {
			setIsLoading(true);
			const result = await getBars({ prefecture, category });
			setBars(result);
			setIsLoading(false);
		};

		fetchBars();
	}, [prefecture, category]);

	if (isLoading) {
		return (
			<div className="animate-fade-in">
				<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">
					店舗一覧
				</h2>
				<div className="text-center py-12 text-muted-foreground">
					<p className="tracking-wide">読み込み中...</p>
				</div>
			</div>
		);
	}

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
