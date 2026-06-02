"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";

interface FoodMenuCreateFormProps {
	barId: string;
}

export default function FoodMenuCreateForm({ barId }: FoodMenuCreateFormProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState("");

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

	const resetForm = () => {
		setName("");
		setDescription("");
		setImageFile(null);
		setImagePreview("");
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess(false);

		if (!name.trim()) {
			setError("メニュー名を入力してください");
			return;
		}

		setLoading(true);

		try {
			let imageUrl: string | null = null;

			if (imageFile) {
				const formData = new FormData();
				formData.append("file", imageFile);
				formData.append("type", "food-menu");

				const uploadRes = await fetch(`/api/bars/${barId}/media`, {
					method: "POST",
					body: formData,
				});

				if (uploadRes.ok) {
					const uploadData = await uploadRes.json();
					imageUrl = uploadData.url || null;
				}
			}

			const res = await fetch(`/api/bars/${barId}/menus/foods`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					description: description.trim() || null,
					image_url: imageUrl,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "登録に失敗しました");
				return;
			}

			setSuccess(true);
			resetForm();

			setTimeout(() => setSuccess(false), 3000);
		} catch (_error) {
			setError("登録に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
			{error && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{success && (
				<div className="rounded-md bg-green-50 p-4">
					<p className="text-sm text-green-800">食事メニューを登録しました</p>
				</div>
			)}

			<div>
				<label
					htmlFor="food-name"
					className="block text-sm font-medium text-gray-700"
				>
					メニュー名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="food-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="自家製ソーセージ盛り合わせ"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="food-description"
					className="block text-sm font-medium text-gray-700"
				>
					説明
				</label>
				<textarea
					id="food-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={4}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
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
					<div className="relative mt-2 w-40 h-40">
						<Image
							src={imagePreview}
							alt="プレビュー"
							fill
							unoptimized
							className="object-cover rounded-md border border-gray-200"
						/>
					</div>
				)}
			</div>

			<div>
				<button
					type="submit"
					disabled={loading}
					className="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "登録中..." : "登録する"}
				</button>
			</div>
		</form>
	);
}
