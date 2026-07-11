"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { uploadMenuImage } from "@/lib/menu-image-upload";
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
		is_active: true,
	});
	// 保存対象の画像URL。既存値を初期表示し、差し替え時はアップロード後のURLで上書き、
	// 削除時は null にする。
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState("");

	const fetchMenu = useCallback(async () => {
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
				is_active: menu.is_active,
			});
			setImageUrl(menu.image_url || null);
			setImagePreview(menu.image_url || "");
		} catch (_error) {
			setError("フードメニューの取得に失敗しました");
		}
	}, [barId, menuId]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleImageRemove = () => {
		setImageFile(null);
		setImageUrl(null);
		setImagePreview("");
	};

	useEffect(() => {
		if (menuId) {
			fetchMenu();
		}
	}, [menuId, fetchMenu]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			let nextImageUrl: string | null = imageUrl;

			if (imageFile) {
				const uploadResult = await uploadMenuImage(
					barId,
					imageFile,
					"food-menu",
				);

				if (!uploadResult.ok) {
					setError(uploadResult.error);
					return;
				}

				nextImageUrl = uploadResult.url;
			}

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
					price: formData.price ? parseInt(formData.price, 10) : null,
					description: formData.description || null,
					image_url: nextImageUrl,
					is_active: formData.is_active,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/menus/foods`);
		} catch (_error) {
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
					htmlFor="food-image"
					className="block text-sm font-medium text-gray-700"
				>
					画像
				</label>
				<input
					type="file"
					id="food-image"
					accept="image/*"
					onChange={handleImageChange}
					className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
				/>
				{imagePreview && (
					<div className="mt-2 flex items-start gap-3">
						<div className="relative w-40 h-40">
							<Image
								src={imagePreview}
								alt="プレビュー"
								fill
								unoptimized
								className="object-cover rounded-md border border-gray-200"
							/>
						</div>
						<button
							type="button"
							onClick={handleImageRemove}
							className="text-sm text-red-500 hover:text-red-700 transition-colors underline"
						>
							画像を削除
						</button>
					</div>
				)}
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
