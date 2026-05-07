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
	bar_owners: Array<{
		admin_user_id: string;
		admin_users: {
			id: string;
			email: string;
			name: string;
		};
	}>;
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
				setError("Failed to fetch bars");
				return;
			}
			const data = await response.json();
			setBars(data.bars || []);
		} catch (error) {
			setError("Failed to fetch bars");
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <div className="p-6">Loading...</div>;
	if (error) return <div className="p-6 text-red-600">{error}</div>;

	return (
		<div className="p-6">
			<div className="flex justify-between mb-6">
				<h1 className="text-2xl font-bold">All Bars</h1>
			</div>
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Location
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Owner
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Status
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Created
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Actions
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
									{bar.bar_owners.length > 0
										? bar.bar_owners[0].admin_users.name
										: "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 text-xs rounded ${bar.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
									>
										{bar.is_active ? "Active" : "Inactive"}
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
										View
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
