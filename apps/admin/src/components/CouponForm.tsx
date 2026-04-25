"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarCoupon } from "@/types/database";

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
				<label className="block text-sm font-medium">Title *</label>
				<input
					type="text"
					name="title"
					required
					value={formData.title}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border rounded"
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium">Discount Type *</label>
					<select
						name="discount_type"
						value={formData.discount_type}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border rounded"
					>
						<option value="percentage">Percentage</option>
						<option value="fixed_amount">Fixed Amount</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium">Discount Value *</label>
					<input
						type="number"
						name="discount_value"
						required
						value={formData.discount_value}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border rounded"
					/>
				</div>
			</div>
			<div>
				<label className="block text-sm font-medium">Code</label>
				<input
					type="text"
					name="code"
					value={formData.code}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border rounded"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium">Usage Limit</label>
				<input
					type="number"
					name="usage_limit"
					value={formData.usage_limit}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border rounded"
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium">Valid From</label>
					<input
						type="date"
						name="valid_from"
						value={formData.valid_from}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border rounded"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium">Valid Until</label>
					<input
						type="date"
						name="valid_until"
						value={formData.valid_until}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border rounded"
					/>
				</div>
			</div>
			<div>
				<label className="block text-sm font-medium">Description</label>
				<textarea
					name="description"
					rows={4}
					value={formData.description}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border rounded"
				/>
			</div>
			<div className="flex items-center">
				<input
					type="checkbox"
					name="is_active"
					checked={formData.is_active}
					onChange={handleChange}
					className="h-4 w-4"
				/>
				<label className="ml-2 text-sm">Active</label>
			</div>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="px-4 py-2 border rounded"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					className="px-4 py-2 bg-blue-600 text-white rounded"
				>
					{loading ? "Saving..." : couponId ? "Update" : "Create"}
				</button>
			</div>
		</form>
	);
}
