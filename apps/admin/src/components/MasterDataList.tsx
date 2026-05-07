"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MasterDataItem {
	id: number;
	name: string;
	description?: string | null;
	country?: string | null;
	is_active: boolean;
}

interface MasterDataListProps {
	title: string;
	endpoint: string;
	newItemPath: string;
	editItemPath: (id: number) => string;
	dataKey: string;
}

export default function MasterDataList({
	title,
	endpoint,
	newItemPath,
	editItemPath,
	dataKey,
}: MasterDataListProps) {
	const [items, setItems] = useState<MasterDataItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchItems();
	}, [endpoint]);

	const fetchItems = async () => {
		try {
			const response = await fetch(endpoint);
			if (!response.ok) {
				setError("データの取得に失敗しました");
				return;
			}
			const data = await response.json();
			setItems(data[dataKey] || []);
		} catch (_error) {
			setError("データの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (itemId: number) => {
		if (!confirm("この項目を削除してもよろしいですか？")) return;
		try {
			await fetch(`${endpoint}/${itemId}`, { method: "DELETE" });
			fetchItems();
		} catch (_error) {
			alert("削除に失敗しました");
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
				<h1 className="text-2xl font-bold">{title}</h1>
				<Link
					href={newItemPath}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					新規追加
				</Link>
			</div>
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								名称
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								説明
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								ステータス
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								操作
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{items.map((item) => (
							<tr key={item.id}>
								<td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
								<td className="px-6 py-4">
									{item.description || item.country || "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 text-xs rounded ${item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
									>
										{item.is_active ? "有効" : "無効"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<Link
										href={editItemPath(item.id)}
										className="text-blue-600 hover:underline mr-4"
									>
										編集
									</Link>
									<button
										onClick={() => handleDelete(item.id)}
										className="text-red-600 hover:underline"
									>
										削除
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
