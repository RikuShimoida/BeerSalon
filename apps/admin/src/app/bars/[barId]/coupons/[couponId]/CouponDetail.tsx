"use client";

import { formatDateLongJst } from "@beersalon/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { BarCoupon } from "@/types/database";

interface CouponDetailProps {
	barId: string;
	couponId: string;
	userRole: "bar_owner" | "admin";
}

export default function CouponDetail({
	barId,
	couponId,
	userRole,
}: CouponDetailProps) {
	const router = useRouter();
	const [coupon, setCoupon] = useState<BarCoupon | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchCoupon = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/coupons/${couponId}`);
			if (!res.ok) {
				if (res.status === 404) {
					setError("クーポンが見つかりません");
				} else {
					setError("クーポンの取得に失敗しました");
				}
				return;
			}
			const data = await res.json();
			setCoupon(data.coupon);
		} catch (_error) {
			setError("クーポンの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId, couponId]);

	useEffect(() => {
		fetchCoupon();
	}, [fetchCoupon]);

	const handleDelete = async () => {
		if (!confirm("このクーポンを削除してもよろしいですか？")) return;

		try {
			const res = await fetch(`/api/bars/${barId}/coupons/${couponId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				alert("削除に失敗しました");
				return;
			}
			router.push(`/bars/${barId}/coupons`);
		} catch (_error) {
			alert("削除に失敗しました");
		}
	};

	const formatDiscountText = (c: BarCoupon) => {
		if (c.discount_type === "percentage") {
			return `${c.discount_value}% OFF`;
		}
		return `${c.discount_value.toLocaleString()}円引き`;
	};

	if (loading) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-8 bg-gray-200 rounded w-1/3" />
				<div className="h-48 bg-gray-200 rounded" />
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

	if (!coupon) return null;

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-2">
				<Link
					href={`/bars/${barId}/coupons`}
					className="text-sm text-gray-500 hover:text-black transition-colors"
				>
					クーポン管理
				</Link>
				<span className="text-sm text-gray-400">/</span>
				<span className="text-sm text-gray-700">クーポン詳細</span>
			</div>

			<h1 className="text-2xl font-bold text-gray-900">{coupon.title}</h1>

			<div className="border border-gray-200 rounded-lg p-6 space-y-4">
				<div>
					<h3 className="text-sm font-medium text-gray-500 mb-1">割引内容</h3>
					<p className="text-lg font-bold text-gray-900">
						{formatDiscountText(coupon)}
					</p>
				</div>

				{coupon.description && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">説明</h3>
						<p className="text-sm text-gray-900 whitespace-pre-wrap">
							{coupon.description}
						</p>
					</div>
				)}

				{coupon.code && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">
							クーポンコード
						</h3>
						<p className="text-sm text-gray-900 font-mono">{coupon.code}</p>
					</div>
				)}

				<div>
					<h3 className="text-sm font-medium text-gray-500 mb-1">有効期間</h3>
					<p className="text-sm text-gray-900">
						{coupon.valid_from && coupon.valid_until
							? `${formatDateLongJst(coupon.valid_from)} 〜 ${formatDateLongJst(coupon.valid_until)}`
							: coupon.valid_from
								? `${formatDateLongJst(coupon.valid_from)} 〜`
								: coupon.valid_until
									? `〜 ${formatDateLongJst(coupon.valid_until)}`
									: "期間なし"}
					</p>
				</div>

				{coupon.usage_limit !== null && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">利用状況</h3>
						<p className="text-sm text-gray-900">
							{coupon.used_count} / {coupon.usage_limit} 回使用済み
						</p>
					</div>
				)}
			</div>

			{isBarOwner && (
				<div className="flex gap-3 pt-4 border-t border-gray-200">
					<Link
						href={`/bars/${barId}/coupons/${couponId}/edit`}
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
