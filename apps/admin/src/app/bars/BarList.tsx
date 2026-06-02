"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Bar } from "@/types/database";

export default function BarList() {
	const [bars, setBars] = useState<Bar[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const fetchBars = useCallback(async () => {
		try {
			const response = await fetch("/api/bars");
			if (response.ok) {
				const data = await response.json();
				setBars(data);
			}
		} catch (_error) {
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchBars();
	}, [fetchBars]);

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4" />
					<div className="h-32 bg-gray-200 rounded" />
					<div className="h-32 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-900">店舗管理</h1>
				<button
					type="button"
					onClick={() => router.push("/bars/new")}
					className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
				>
					店舗を登録する
				</button>
			</div>

			{bars.length === 0 ? (
				<div className="border border-gray-200 rounded-lg p-12 text-center">
					<p className="text-gray-500 mb-4">登録されている店舗がありません</p>
					<button
						type="button"
						onClick={() => router.push("/bars/new")}
						className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
					>
						最初の店舗を登録する
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{bars.map((bar) => (
						<Link
							key={bar.id}
							href={`/bars/${bar.id}`}
							className="block border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors"
						>
							{bar.preview_image_url ? (
								<div className="aspect-video bg-gray-100 relative">
									<Image
										src={bar.preview_image_url}
										alt={bar.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="aspect-video bg-gray-100 flex items-center justify-center">
									<span className="text-gray-400 text-sm">No Image</span>
								</div>
							)}
							<div className="p-4">
								<h2 className="text-base font-bold text-gray-900">
									{bar.name}
								</h2>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
