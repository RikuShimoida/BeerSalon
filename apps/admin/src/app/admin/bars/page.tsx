"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bar {
	id: number;
	name: string;
	prefecture: string | null;
	city: string | null;
	is_active: boolean;
	created_at: string;
}

export default function AllBarsPage() {
	const [bars, setBars] = useState<Bar[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchBars();
	}, []);

	const fetchBars = async () => {
		try {
			const response = await fetch("/api/admin/bars");
			if (!response.ok) {
				setError("バー一覧の取得に失敗しました");
				return;
			}
			const data = await response.json();
			setBars(data.bars || []);
		} catch (_error) {
			setError("バー一覧の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	if (loading)
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="h-64 bg-gray-200 rounded"></div>
				</div>
			</div>
		);
	if (error)
		return (
			<div className="p-6">
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			</div>
		);

	return (
		<div className="p-6">
			<div className="flex justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold">全バー一覧</h1>
					<p className="mt-1 text-sm text-gray-600">
						登録されている全バーの一覧です
					</p>
				</div>
			</div>
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								店舗名
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								所在地
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								ステータス
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								作成日
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								操作
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{bars.map((bar) => (
							<tr key={bar.id}>
								<td className="px-6 py-4 whitespace-nowrap font-medium">
									{bar.name}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									{bar.prefecture && bar.city
										? `${bar.prefecture} ${bar.city}`
										: "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 text-xs rounded ${bar.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
									>
										{bar.is_active ? "有効" : "無効"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{new Date(bar.created_at).toLocaleDateString()}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<Link
										href={`/bars/${bar.id}/edit`}
										className="text-blue-600 hover:underline"
									>
										詳細
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
