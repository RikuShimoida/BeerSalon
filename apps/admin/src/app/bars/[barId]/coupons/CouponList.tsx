"use client";

import { useEffect, useState } from "react";
import { BarCoupon } from "@/types/database";
import Link from "next/link";

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
				setError("Failed to fetch coupons");
				return;
			}
			const data = await response.json();
			setCoupons(data.coupons || []);
		} catch (error) {
			setError("Failed to fetch coupons");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (couponId: number) => {
		if (!confirm("Delete this coupon?")) return;
		try {
			await fetch(`/api/bars/${barId}/coupons/${couponId}`, {
				method: "DELETE",
			});
			fetchCoupons();
		} catch (error) {
			alert("Failed to delete");
		}
	};

	if (loading) return <div className="p-6">Loading...</div>;
	if (error) return <div className="p-6 text-red-600">{error}</div>;

	return (
		<div className="p-6">
			<div className="flex justify-between mb-6">
				<h1 className="text-2xl font-bold">Coupons</h1>
				<Link
					href={`/bars/${barId}/coupons/new`}
					className="px-4 py-2 bg-blue-600 text-white rounded"
				>
					Add Coupon
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
							<p className="font-mono mt-2">Code: {coupon.code}</p>
						)}
						<div className="flex gap-2 mt-4">
							<Link
								href={`/bars/${barId}/coupons/${coupon.id}/edit`}
								className="flex-1 text-center px-3 py-2 border rounded"
							>
								Edit
							</Link>
							<button
								onClick={() => handleDelete(coupon.id)}
								className="flex-1 px-3 py-2 border border-red-300 text-red-700 rounded"
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
