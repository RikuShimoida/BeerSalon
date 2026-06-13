"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { BarBeerMenuDetail } from "@/types/database";

interface BeerMenuDetailProps {
	barId: string;
	menuId: string;
	userRole: "bar_owner" | "admin";
}

export default function BeerMenuDetail({
	barId,
	menuId,
	userRole,
}: BeerMenuDetailProps) {
	const router = useRouter();
	const [menu, setMenu] = useState<BarBeerMenuDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchMenu = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/menus/beers/${menuId}`);
			if (!res.ok) {
				if (res.status === 404) {
					setError("ビールメニューが見つかりません");
				} else {
					setError("ビールメニューの取得に失敗しました");
				}
				return;
			}
			const data = await res.json();
			setMenu(data);
		} catch (_error) {
			setError("ビールメニューの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId, menuId]);

	useEffect(() => {
		fetchMenu();
	}, [fetchMenu]);

	const handleDelete = async () => {
		if (!confirm("このビールメニューを削除してもよろしいですか？")) return;

		try {
			const res = await fetch(`/api/bars/${barId}/menus/beers/${menuId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				alert("削除に失敗しました");
				return;
			}
			router.push(`/bars/${barId}/menus`);
		} catch (_error) {
			alert("削除に失敗しました");
		}
	};

	if (loading) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-8 bg-gray-200 rounded w-1/3" />
				<div className="h-64 bg-gray-200 rounded" />
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

	if (!menu) return null;

	const countryName = menu.beer?.region?.country?.name;
	const regionName = menu.beer?.region?.name;
	const breweryName = menu.beer?.brewery?.name;

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-2">
				<Link
					href={`/bars/${barId}/menus`}
					className="text-sm text-gray-500 hover:text-black transition-colors"
				>
					メニュー管理
				</Link>
				<span className="text-sm text-gray-400">/</span>
				<span className="text-sm text-gray-700">ビールメニュー詳細</span>
			</div>

			{(menu.image_url || menu.beer?.image_url) && (
				<div className="relative w-full h-64 md:h-80">
					<Image
						src={menu.image_url || menu.beer?.image_url || ""}
						alt={menu.beer?.name || "ビールメニュー"}
						fill
						className="object-cover rounded-lg border border-gray-200"
					/>
				</div>
			)}

			<h1 className="text-2xl font-bold text-gray-900">
				{menu.beer?.name || "不明なメニュー"}
			</h1>

			<dl className="space-y-4">
				{countryName && (
					<div>
						<dt className="text-sm font-medium text-gray-500">国</dt>
						<dd className="mt-1 text-sm text-gray-900">{countryName}</dd>
					</div>
				)}

				{regionName && (
					<div>
						<dt className="text-sm font-medium text-gray-500">産地</dt>
						<dd className="mt-1 text-sm text-gray-900">{regionName}</dd>
					</div>
				)}

				{breweryName && (
					<div>
						<dt className="text-sm font-medium text-gray-500">醸造所</dt>
						<dd className="mt-1 text-sm text-gray-900">{breweryName}</dd>
					</div>
				)}

				{menu.sizes && menu.sizes.length > 0 && (
					<div>
						<dt className="text-sm font-medium text-gray-500 mb-2">
							サイズ / 価格
						</dt>
						<dd>
							<table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											サイズ
										</th>
										<th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
											価格
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{menu.sizes.map((size) => (
										<tr key={size.id}>
											<td className="px-4 py-2 text-sm text-gray-900">
												{size.size_name}
											</td>
											<td className="px-4 py-2 text-sm text-gray-900 text-right">
												{size.price != null
													? `${size.price.toLocaleString()}円`
													: "-"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</dd>
					</div>
				)}

				{menu.description && (
					<div>
						<dt className="text-sm font-medium text-gray-500">説明</dt>
						<dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
							{menu.description}
						</dd>
					</div>
				)}
			</dl>

			{isBarOwner && (
				<div className="flex gap-3 pt-4 border-t border-gray-200">
					<Link
						href={`/bars/${barId}/menus/beers/${menuId}/edit`}
						className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
					>
						編集
					</Link>
					<button
						type="button"
						onClick={handleDelete}
						className="flex-1 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
					>
						削除
					</button>
				</div>
			)}
		</div>
	);
}
