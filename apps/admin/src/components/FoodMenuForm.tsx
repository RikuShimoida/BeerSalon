"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { BarFoodMenu } from "@/types/database";

interface FoodMenuFormProps {
	barId: string;
	menuId?: string;
}

export default function FoodMenuForm({ barId, menuId }: FoodMenuFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		name: "",
		price: "",
		description: "",
		image_url: "",
		category: "",
		is_active: true,
	});

	useEffect(() => {
		if (menuId) {
			fetchMenu();
		}
	}, [menuId]);

	const fetchMenu = async () => {
		try {
			const response = await fetch(`/api/bars/${barId}/menus/foods/${menuId}`);

			if (!response.ok) {
				setError("フードメニューの取得に失敗しました");
				return;
			}

			const data = await response.json();
			const menu: BarFoodMenu = data.menu;

			setFormData({
				name: menu.name,
				price: menu.price?.toString() || "",
				description: menu.description || "",
				image_url: menu.image_url || "",
				category: menu.category || "",
				is_active: menu.is_active,
			});
		} catch (error) {
			setError("フードメニューの取得に失敗しました");
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const url = menuId
				? `/api/bars/${barId}/menus/foods/${menuId}`
				: `/api/bars/${barId}/menus/foods`;

			const method = menuId ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					price: formData.price ? parseInt(formData.price) : null,
					description: formData.description || null,
					image_url: formData.image_url || null,
					category: formData.category || null,
					is_active: formData.is_active,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/menus/foods`);
		} catch (error) {
			setError("保存に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;

		if (type === "checkbox") {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData((prev) => ({ ...prev, [name]: checked }));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-gray-700"
				>
					メニュー名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="name"
					name="name"
					required
					value={formData.name}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="唐揚げ"
				/>
			</div>

			<div>
				<label
					htmlFor="category"
					className="block text-sm font-medium text-gray-700"
				>
					カテゴリ
				</label>
				<input
					type="text"
					id="category"
					name="category"
					value={formData.category}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="揚げ物、おつまみ、など"
				/>
			</div>

			<div>
				<label
					htmlFor="price"
					className="block text-sm font-medium text-gray-700"
				>
					価格（円）
				</label>
				<input
					type="number"
					id="price"
					name="price"
					value={formData.price}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="500"
				/>
			</div>

			<div>
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					説明
				</label>
				<textarea
					id="description"
					name="description"
					rows={4}
					value={formData.description}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="メニューの説明を入力してください"
				/>
			</div>

			<div>
				<label
					htmlFor="image_url"
					className="block text-sm font-medium text-gray-700"
				>
					画像URL
				</label>
				<input
					type="url"
					id="image_url"
					name="image_url"
					value={formData.image_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="https://example.com/image.jpg"
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
				<label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
					提供中
				</label>
			</div>

			<div className="flex justify-end space-x-3">
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
					{loading ? "保存中..." : menuId ? "更新" : "作成"}
				</button>
			</div>
		</form>
	);
}
