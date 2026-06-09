"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BarBeerMenuDetail } from "@/types/database";

interface BeerMenuListProps {
	barId: string;
}

export default function BeerMenuList({ barId }: BeerMenuListProps) {
	const [menus, setMenus] = useState<BarBeerMenuDetail[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");

	const fetchMenus = useCallback(async () => {
		try {
			const response = await fetch(`/api/bars/${barId}/menus/beers`);

			if (!response.ok) {
				if (response.status === 403) {
					setError("アクセス権限がありません");
				} else {
					setError("ビールメニューの取得に失敗しました");
				}
				return;
			}

			const data = await response.json();
			setMenus(data);
		} catch (_error) {
			setError("ビールメニューの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchMenus();
	}, [fetchMenus]);

	const handleDelete = async (menuId: number) => {
		if (!confirm("このビールメニューを削除してもよろしいですか?")) {
			return;
		}

		try {
			const response = await fetch(`/api/bars/${barId}/menus/beers/${menuId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				alert("削除に失敗しました");
				return;
			}

			fetchMenus();
		} catch (_error) {
			alert("削除に失敗しました");
		}
	};

	// フィルタリング
	const filteredMenus = menus.filter((menu) => {
		const matchesSearch =
			!searchQuery ||
			menu.beer.name.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory =
			!categoryFilter || menu.beer.category.id.toString() === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	// ユニークなカテゴリの取得
	const categories = Array.from(
		new Set(menus.map((menu) => menu.beer.category)),
	).filter(
		(category, index, self) =>
			index === self.findIndex((c) => c.id === category.id),
	);

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-64 bg-gray-200 rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6">
				<div className="flex justify-between items-center mb-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							ビールメニュー管理
						</h1>
						<p className="mt-1 text-sm text-gray-600">
							ビールマスタから選択してメニューに追加できます
						</p>
					</div>
					<Link
						href={`/bars/${barId}/menus/beers/new`}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						ビールを追加
					</Link>
				</div>

				{/* 検索・フィルタ */}
				<div className="bg-white p-4 rounded-lg shadow mb-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="search"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								ビール名で検索
							</label>
							<input
								type="text"
								id="search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="ビール名を入力..."
								className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							/>
						</div>
						<div>
							<label
								htmlFor="category"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								カテゴリでフィルタ
							</label>
							<select
								id="category"
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							>
								<option value="">全てのカテゴリ</option>
								{categories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{filteredMenus.length === 0 ? (
				<div className="text-center py-12 bg-white rounded-lg shadow">
					<svg
						className="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						ビールメニューがありません
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						{searchQuery || categoryFilter
							? "検索条件に一致するビールメニューがありません"
							: "ビールマスタから選択してメニューを追加してください"}
					</p>
					{!searchQuery && !categoryFilter && (
						<div className="mt-6">
							<Link
								href={`/bars/${barId}/menus/beers/new`}
								className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								ビールを追加
							</Link>
						</div>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredMenus.map((menu) => (
						<div
							key={menu.id}
							className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
						>
							{menu.image_url || menu.beer.image_url ? (
								<div className="relative w-full h-48">
									<Image
										src={menu.image_url || menu.beer.image_url || ""}
										alt={menu.beer.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="w-full h-48 bg-gray-200 flex items-center justify-center">
									<svg
										className="h-12 w-12 text-gray-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
							)}

							<div className="p-4">
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<h3 className="text-lg font-semibold text-gray-900 mb-1">
											{menu.beer.name}
										</h3>
										<p className="text-sm text-gray-600">
											{menu.beer.brewery?.name || "醸造所不明"}
										</p>
									</div>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											menu.is_active
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{menu.is_active ? "提供中" : "品切れ"}
									</span>
								</div>

								<div className="space-y-2 mb-4">
									<div className="flex items-center text-sm text-gray-600">
										<span className="font-medium mr-2">カテゴリ:</span>
										<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
											{menu.beer.category.name}
										</span>
									</div>

									{menu.sizes && menu.sizes.length > 0 && (
										<div className="text-sm text-gray-600">
											<span className="font-medium mr-2">価格:</span>
											{menu.sizes.map((s) => (
												<span key={s.id} className="mr-3">
													{s.size_name}
													{s.price != null && (
														<span className="ml-1 font-bold text-gray-900">
															¥{s.price.toLocaleString()}
														</span>
													)}
												</span>
											))}
										</div>
									)}

									{menu.beer.abv && (
										<div className="flex items-center text-sm text-gray-600">
											<span className="font-medium mr-2">アルコール度数:</span>
											<span>{menu.beer.abv}%</span>
										</div>
									)}
								</div>

								{menu.description && (
									<p className="text-sm text-gray-600 mb-4 line-clamp-2">
										{menu.description}
									</p>
								)}

								<div className="flex space-x-2">
									<Link
										href={`/bars/${barId}/menus/beers/${menu.id}/edit`}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
									>
										編集
									</Link>
									<button
										type="button"
										onClick={() => handleDelete(menu.id)}
										className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
