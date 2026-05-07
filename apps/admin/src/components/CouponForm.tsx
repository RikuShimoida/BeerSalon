"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { BarCoupon } from "@/types/database";

interface CouponFormProps {
	barId: string;
	couponId?: string;
}

export default function CouponForm({ barId, couponId }: CouponFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		discount_type: "percentage" as "percentage" | "fixed_amount",
		discount_value: "",
		code: "",
		usage_limit: "",
		valid_from: "",
		valid_until: "",
		is_active: true,
	});

	useEffect(() => {
		if (couponId) fetchCoupon();
	}, [couponId]);

	const fetchCoupon = async () => {
		const res = await fetch(`/api/bars/${barId}/coupons/${couponId}`);
		const data = await res.json();
		const coupon: BarCoupon = data.coupon;
		setFormData({
			title: coupon.title,
			description: coupon.description || "",
			discount_type: coupon.discount_type,
			discount_value: coupon.discount_value.toString(),
			code: coupon.code || "",
			usage_limit: coupon.usage_limit?.toString() || "",
			valid_from: coupon.valid_from
				? new Date(coupon.valid_from).toISOString().slice(0, 10)
				: "",
			valid_until: coupon.valid_until
				? new Date(coupon.valid_until).toISOString().slice(0, 10)
				: "",
			is_active: coupon.is_active,
		});
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		const url = couponId
			? `/api/bars/${barId}/coupons/${couponId}`
			: `/api/bars/${barId}/coupons`;
		await fetch(url, {
			method: couponId ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(formData),
		});
		router.push(`/bars/${barId}/coupons`);
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const val =
			type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
		setFormData((prev) => ({ ...prev, [name]: val }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label htmlFor="title" className="block text-sm font-medium text-gray-700">
					タイトル <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="title"
					name="title"
					required
					value={formData.title}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">
						割引タイプ <span className="text-red-500">*</span>
					</label>
					<select
						id="discount_type"
						name="discount_type"
						value={formData.discount_type}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					>
						<option value="percentage">パーセント</option>
						<option value="fixed_amount">固定金額</option>
					</select>
				</div>
				<div>
					<label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">
						割引値 <span className="text-red-500">*</span>
					</label>
					<input
						type="number"
						id="discount_value"
						name="discount_value"
						required
						value={formData.discount_value}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
			</div>
			<div>
				<label htmlFor="code" className="block text-sm font-medium text-gray-700">
					クーポンコード
				</label>
				<input
					type="text"
					id="code"
					name="code"
					value={formData.code}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>
			<div>
				<label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700">
					利用回数上限
				</label>
				<input
					type="number"
					id="usage_limit"
					name="usage_limit"
					value={formData.usage_limit}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="valid_from" className="block text-sm font-medium text-gray-700">
						有効期間開始
					</label>
					<input
						type="date"
						id="valid_from"
						name="valid_from"
						value={formData.valid_from}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				<div>
					<label htmlFor="valid_until" className="block text-sm font-medium text-gray-700">
						有効期間終了
					</label>
					<input
						type="date"
						id="valid_until"
						name="valid_until"
						value={formData.valid_until}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
			</div>
			<div>
				<label htmlFor="description" className="block text-sm font-medium text-gray-700">説明</label>
				<textarea
					id="description"
					name="description"
					rows={4}
					value={formData.description}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>
			<div className="flex items-center">
				<input
					type="checkbox"
					id="is_active"
					name="is_active"
					checked={formData.is_active}
					onChange={handleChange}
					className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label htmlFor="is_active" className="ml-2 text-sm text-gray-900">有効</label>
			</div>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={loading}
					className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "保存中..." : couponId ? "更新" : "作成"}
				</button>
			</div>
		</form>
	);
}
