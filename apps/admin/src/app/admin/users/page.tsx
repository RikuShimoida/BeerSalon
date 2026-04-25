"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
	id: string;
	email: string;
	name: string;
	role: "bar_owner" | "admin";
	is_active: boolean;
	created_at: string;
	bar_owners: Array<{
		bar_id: number;
		bars: {
			id: number;
			name: string;
		};
	}>;
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const response = await fetch("/api/admin/users");
			if (!response.ok) {
				setError("Failed to fetch users");
				return;
			}
			const data = await response.json();
			setUsers(data.users || []);
		} catch (error) {
			setError("Failed to fetch users");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (userId: string) => {
		if (!confirm("Delete this user?")) return;
		try {
			await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
			fetchUsers();
		} catch (error) {
			alert("Failed to delete");
		}
	};

	if (loading) return <div className="p-6">Loading...</div>;
	if (error) return <div className="p-6 text-red-600">{error}</div>;

	return (
		<div className="p-6">
			<div className="flex justify-between mb-6">
				<h1 className="text-2xl font-bold">Admin Users</h1>
				<Link
					href="/admin/users/new"
					className="px-4 py-2 bg-blue-600 text-white rounded"
				>
					Add User
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
								Email
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Role
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Bar
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
						{users.map((user) => (
							<tr key={user.id}>
								<td className="px-6 py-4 whitespace-nowrap font-medium">
									{user.name}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 text-xs rounded ${user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
									>
										{user.role === "admin" ? "Admin" : "Bar Owner"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									{user.bar_owners.length > 0
										? user.bar_owners[0].bars.name
										: "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 text-xs rounded ${user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
									>
										{user.is_active ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{new Date(user.created_at).toLocaleDateString()}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<Link
										href={`/admin/users/${user.id}/edit`}
										className="text-blue-600 hover:underline mr-4"
									>
										Edit
									</Link>
									<button
										onClick={() => handleDelete(user.id)}
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
