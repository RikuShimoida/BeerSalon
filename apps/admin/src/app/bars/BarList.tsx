"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Bar } from "@/types/database";

export default function BarList() {
	const [bars, setBars] = useState<Bar[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const router = useRouter();

	useEffect(() => {
		fetchBars();
	}, []);

	const fetchBars = async () => {
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
	};

	const handleDelete = async (barId: number) => {
		if (!confirm("本当に削除しますか？")) {
			return;
		}

		try {
			const response = await fetch(`/api/bars/${barId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				// 一覧を再取得
				fetchBars();
			} else {
				alert("削除できませんでした");
			}
		} catch (error) {
			alert("削除できませんでした");
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="h-32 bg-gray-200 rounded"></div>
					<div className="h-32 bg-gray-200 rounded"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-900">バー管理</h1>
				<button
					onClick={() => router.push("/bars/new")}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					+ 新規登録
				</button>
			</div>

			{bars.length === 0 ? (
				<div className="bg-white shadow rounded-lg p-12 text-center">
					<p className="text-gray-500 mb-4">登録されているバーがありません</p>
					<button
						onClick={() => router.push("/bars/new")}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						最初のバーを登録する
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{bars.map((bar) => (
						<div
							key={bar.id}
							className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center space-x-4">
										{bar.preview_image_url ? (
											<img
												src={bar.preview_image_url}
												alt={bar.name}
												className="w-24 h-24 object-cover rounded-lg"
											/>
										) : (
											<div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
												<span className="text-4xl">🏪</span>
											</div>
										)}
										<div className="flex-1">
											<h2 className="text-xl font-semibold text-gray-900 mb-2">
												{bar.name}
											</h2>
											{(bar.prefecture || bar.city || bar.address_line1) && (
												<p className="text-sm text-gray-600 mb-1">
													📍 {bar.prefecture} {bar.city} {bar.address_line1}
												</p>
											)}
											{bar.phone_number && (
												<p className="text-sm text-gray-600 mb-1">
													📞 {bar.phone_number}
												</p>
											)}
											{bar.description && (
												<p className="text-sm text-gray-700 mt-2">
													{bar.description}
												</p>
											)}
										</div>
									</div>
								</div>
								<div className="flex items-start space-x-2 ml-4">
									<button
										onClick={() =>
											router.push(`/bars/${bar.id}/menus/beers`)
										}
										className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										メニュー管理
									</button>
									<button
										onClick={() => router.push(`/bars/${bar.id}/edit`)}
										className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										編集
									</button>
									<button
										onClick={() => handleDelete(bar.id)}
										className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
									>
										削除
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
