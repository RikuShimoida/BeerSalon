"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { BarFoodMenu } from "@/types/database";

interface FoodMenuDetailProps {
	barId: string;
	menuId: string;
	userRole: "bar_owner" | "admin";
}

export default function FoodMenuDetail({
	barId,
	menuId,
	userRole,
}: FoodMenuDetailProps) {
	const router = useRouter();
	const [menu, setMenu] = useState<BarFoodMenu | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchMenu = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/menus/foods/${menuId}`);
			if (!res.ok) {
				if (res.status === 404) {
					setError("食事メニューが見つかりません");
				} else {
					setError("食事メニューの取得に失敗しました");
				}
				return;
			}
			const data = await res.json();
			setMenu(data.menu);
		} catch (_error) {
			setError("食事メニューの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId, menuId]);

	useEffect(() => {
		fetchMenu();
	}, [fetchMenu]);

	const handleDelete = async () => {
		if (!confirm("この食事メニューを削除してもよろしいですか？")) return;

		try {
			const res = await fetch(`/api/bars/${barId}/menus/foods/${menuId}`, {
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
				<span className="text-sm text-gray-700">食事メニュー詳細</span>
			</div>

			{menu.image_url && (
				<div className="relative w-full h-64 md:h-80">
					<Image
						src={menu.image_url}
						alt={menu.name}
						fill
						className="object-cover rounded-lg border border-gray-200"
					/>
				</div>
			)}

			<h1 className="text-2xl font-bold text-gray-900">{menu.name}</h1>

			{menu.description && (
				<div>
					<dt className="text-sm font-medium text-gray-500">説明</dt>
					<dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
						{menu.description}
					</dd>
				</div>
			)}

			{isBarOwner && (
				<div className="flex gap-3 pt-4 border-t border-gray-200">
					<Link
						href={`/bars/${barId}/menus/foods/${menuId}/edit`}
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
