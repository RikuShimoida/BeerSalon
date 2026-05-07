"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
				setError("ユーザー一覧の取得に失敗しました");
				return;
			}
			const data = await response.json();
			setUsers(data.users || []);
		} catch (_error) {
			setError("ユーザー一覧の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (userId: string) => {
		if (!confirm("このユーザーを削除してもよろしいですか？")) return;
		try {
			await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
			fetchUsers();
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
				<div>
					<h1 className="text-2xl font-bold">管理ユーザー一覧</h1>
					<p className="mt-1 text-sm text-gray-600">
						管理画面にアクセスできるユーザーの一覧です
					</p>
				</div>
				<Link
					href="/admin/users/new"
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					ユーザーを追加
				</Link>
			</div>
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								氏名
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								メール
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								権限
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
								担当バー
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
										{user.role === "admin" ? "管理者" : "バーオーナー"}
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
										{user.is_active ? "有効" : "無効"}
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
										編集
									</Link>
									<button
										onClick={() => handleDelete(user.id)}
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
