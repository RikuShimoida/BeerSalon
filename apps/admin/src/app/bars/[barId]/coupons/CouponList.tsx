"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BarCoupon } from "@/types/database";

interface CouponListProps {
	barId: string;
}

export default function CouponList({ barId }: CouponListProps) {
	const [coupons, setCoupons] = useState<BarCoupon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchCoupons();
	}, [barId]);

	const fetchCoupons = async () => {
		try {
			const response = await fetch(`/api/bars/${barId}/coupons`);
			if (!response.ok) {
				setError("クーポンの取得に失敗しました");
				return;
			}
			const data = await response.json();
			setCoupons(data.coupons || []);
		} catch (_error) {
			setError("クーポンの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (couponId: number) => {
		if (!confirm("このクーポンを削除してもよろしいですか？")) return;
		try {
			await fetch(`/api/bars/${barId}/coupons/${couponId}`, {
				method: "DELETE",
			});
			fetchCoupons();
		} catch (_error) {
			alert("削除に失敗しました");
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-48 bg-gray-200 rounded"></div>
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
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">クーポン管理</h1>
					<p className="mt-1 text-sm text-gray-600">
						クーポンの追加・編集・削除ができます
					</p>
				</div>
				<Link
					href={`/bars/${barId}/coupons/new`}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					クーポンを追加
				</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{coupons.map((coupon) => (
					<div key={coupon.id} className="bg-white rounded-lg shadow p-4">
						<h3 className="font-bold text-lg">{coupon.title}</h3>
						<p className="text-sm text-gray-600">{coupon.description}</p>
						<p className="mt-2">
							{coupon.discount_type === "percentage"
								? `${coupon.discount_value}%`
								: `¥${coupon.discount_value}`}{" "}
							OFF
						</p>
						{coupon.code && (
							<p className="font-mono mt-2">コード: {coupon.code}</p>
						)}
						<div className="flex gap-2 mt-4">
							<Link
								href={`/bars/${barId}/coupons/${coupon.id}/edit`}
								className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								編集
							</Link>
							<button
								onClick={() => handleDelete(coupon.id)}
								className="flex-1 px-3 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								削除
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
