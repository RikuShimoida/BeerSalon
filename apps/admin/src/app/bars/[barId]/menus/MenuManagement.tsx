"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BarBeerMenuDetail, BarFoodMenu } from "@/types/database";

interface MenuManagementProps {
	barId: string;
	userRole: "bar_owner" | "admin";
}

export default function MenuManagement({
	barId,
	userRole,
}: MenuManagementProps) {
	const [beerMenus, setBeerMenus] = useState<BarBeerMenuDetail[]>([]);
	const [foodMenus, setFoodMenus] = useState<BarFoodMenu[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchMenus = useCallback(async () => {
		try {
			const [beerRes, foodRes] = await Promise.all([
				fetch(`/api/bars/${barId}/menus/beers`),
				fetch(`/api/bars/${barId}/menus/foods`),
			]);

			if (!beerRes.ok || !foodRes.ok) {
				setError("メニューの取得に失敗しました");
				return;
			}

			const beerData = await beerRes.json();
			const foodData = await foodRes.json();

			setBeerMenus(beerData);
			setFoodMenus(foodData.menus || []);
		} catch (_error) {
			setError("メニューの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchMenus();
	}, [fetchMenus]);

	if (loading) {
		return (
			<div className="animate-pulse space-y-6">
				<div className="h-8 bg-gray-200 rounded w-1/4" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-48 bg-gray-200 rounded" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4">
				<p className="text-sm text-red-800">{error}</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold text-gray-900">メニュー管理</h1>
				<div className="flex items-center gap-4">
					{isBarOwner && (
						<Link
							href={`/bars/${barId}/menus/new`}
							className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
						>
							メニューを登録する
						</Link>
					)}
				</div>
			</div>

			<nav className="flex gap-4 border-b border-gray-200 pb-2">
				<a
					href="#beers"
					className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
				>
					ビールメニュー
				</a>
				<a
					href="#foods"
					className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
				>
					食事メニュー
				</a>
			</nav>

			<section id="beers">
				<h2 className="text-lg font-bold text-gray-900 mb-4">ビールメニュー</h2>
				{beerMenus.length === 0 ? (
					<div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
						<p className="text-sm text-gray-500">
							ビールメニューがまだ登録されていません
						</p>
						{isBarOwner && (
							<Link
								href={`/bars/${barId}/menus/new`}
								className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
							>
								メニューを登録する
							</Link>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{beerMenus.map((menu) => (
							<Link
								key={menu.id}
								href={`/bars/${barId}/menus/beers/${menu.id}`}
								className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
							>
								{menu.image_url || menu.beer?.image_url ? (
									<div className="relative w-full h-40">
										<Image
											src={menu.image_url || menu.beer?.image_url || ""}
											alt={menu.beer?.name || "ビールメニュー"}
											fill
											className="object-cover"
										/>
									</div>
								) : (
									<div
										className="w-full h-40 bg-gray-100 flex items-center justify-center"
										role="img"
										aria-label="画像なし"
									>
										<span className="text-3xl text-gray-300">🍺</span>
									</div>
								)}
								<div className="p-4">
									<h3 className="font-bold text-gray-900 truncate">
										{menu.beer?.name || "不明なメニュー"}
									</h3>
									<p className="text-sm text-gray-500 mt-1">
										{menu.beer?.brewery?.name || ""}
									</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>

			<section id="foods">
				<h2 className="text-lg font-bold text-gray-900 mb-4">食事メニュー</h2>
				{foodMenus.length === 0 ? (
					<div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
						<p className="text-sm text-gray-500">
							食事メニューがまだ登録されていません
						</p>
						{isBarOwner && (
							<Link
								href={`/bars/${barId}/menus/new`}
								className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
							>
								メニューを登録する
							</Link>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{foodMenus.map((menu) => (
							<Link
								key={menu.id}
								href={`/bars/${barId}/menus/foods/${menu.id}`}
								className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
							>
								{menu.image_url ? (
									<div className="relative w-full h-40">
										<Image
											src={menu.image_url}
											alt={menu.name}
											fill
											className="object-cover"
										/>
									</div>
								) : (
									<div
										className="w-full h-40 bg-gray-100 flex items-center justify-center"
										role="img"
										aria-label="画像なし"
									>
										<span className="text-3xl text-gray-300">🍽</span>
									</div>
								)}
								<div className="p-4">
									<h3 className="font-bold text-gray-900 truncate">
										{menu.name}
									</h3>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
