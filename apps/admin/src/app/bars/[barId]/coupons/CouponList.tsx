"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BarCoupon } from "@/types/database";

interface CouponListProps {
	barId: string;
	userRole: "bar_owner" | "admin";
}

export default function CouponList({ barId, userRole }: CouponListProps) {
	const [coupons, setCoupons] = useState<BarCoupon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchCoupons = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/coupons`);
			if (!res.ok) {
				setError("クーポンの取得に失敗しました");
				return;
			}
			const data = await res.json();
			setCoupons(data.coupons || []);
		} catch (_error) {
			setError("クーポンの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchCoupons();
	}, [fetchCoupons]);

	const formatDiscountText = (coupon: BarCoupon) => {
		if (coupon.discount_type === "percentage") {
			return `${coupon.discount_value}% OFF`;
		}
		return `${coupon.discount_value.toLocaleString()}円引き`;
	};

	const formatPeriod = (coupon: BarCoupon) => {
		if (!coupon.valid_from && !coupon.valid_until) return "期間なし";
		const from = coupon.valid_from
			? new Date(coupon.valid_from).toLocaleDateString("ja-JP")
			: "";
		const until = coupon.valid_until
			? new Date(coupon.valid_until).toLocaleDateString("ja-JP")
			: "";
		if (from && until) return `${from} 〜 ${until}`;
		if (from) return `${from} 〜`;
		return `〜 ${until}`;
	};

	if (loading) {
		return (
			<div className="animate-pulse space-y-6">
				<div className="h-8 bg-gray-200 rounded w-1/4" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-36 bg-gray-200 rounded" />
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
				<h1 className="text-2xl font-bold text-gray-900">クーポン管理</h1>
				{isBarOwner && (
					<Link
						href={`/bars/${barId}/coupons/new`}
						className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
					>
						クーポンを登録する
					</Link>
				)}
			</div>

			{coupons.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
					<p className="text-sm text-gray-500">
						クーポンがまだ登録されていません
					</p>
					{isBarOwner && (
						<Link
							href={`/bars/${barId}/coupons/new`}
							className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
						>
							クーポンを登録する
						</Link>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{coupons.map((coupon) => (
						<Link
							key={coupon.id}
							href={`/bars/${barId}/coupons/${coupon.id}`}
							className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
						>
							<h3 className="font-bold text-gray-900 truncate">
								{coupon.title}
							</h3>
							<p className="text-sm font-medium text-gray-700 mt-1">
								{formatDiscountText(coupon)}
							</p>
							<p className="text-xs text-gray-500 mt-2">
								{formatPeriod(coupon)}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
