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
				setError("Failed to fetch items");
				return;
			}
			const data = await response.json();
			setItems(data[dataKey] || []);
		} catch (error) {
			setError("Failed to fetch items");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (itemId: number) => {
		if (!confirm("Delete this item?")) return;
		try {
			await fetch(`${endpoint}/${itemId}`, { method: "DELETE" });
			fetchItems();
		} catch (error) {
			alert("Failed to delete");
		}
	};

	if (loading) return <div className="p-6">Loading...</div>;
	if (error) return <div className="p-6 text-red-600">{error}</div>;

	return (
		<div className="p-6">
			<div className="flex justify-between mb-6">
				<h1 className="text-2xl font-bold">{title}</h1>
				<Link
					href={newItemPath}
					className="px-4 py-2 bg-blue-600 text-white rounded"
				>
					Add New
				</Link>
			</div>
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Description
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Status
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Actions
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
										{item.is_active ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<Link
										href={editItemPath(item.id)}
										className="text-blue-600 hover:underline mr-4"
									>
										Edit
									</Link>
									<button
										onClick={() => handleDelete(item.id)}
										className="text-red-600 hover:underline"
									>
										Delete
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
