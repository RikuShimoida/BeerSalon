"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import type { BarBeerMenu, Beer, BeerCategory } from "@/types/database";

interface BeerMenuFormProps {
	barId: string;
	menu?: BarBeerMenu;
	isEdit?: boolean;
}

export default function BeerMenuForm({
	barId,
	menu,
	isEdit = false,
}: BeerMenuFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// マスタデータ
	const [beers, setBeers] = useState<Beer[]>([]);
	const [categories, setCategories] = useState<BeerCategory[]>([]);
	const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);

	// 検索・フィルタ
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");

	// フォームデータ
	const firstSize = menu?.sizes?.[0];
	const [formData, setFormData] = useState({
		beer_id: menu?.beer_id || 0,
		price: firstSize?.price ?? "",
		size: firstSize?.size_name ?? "",
		description: menu?.description || "",
		image_url: menu?.image_url || "",
		is_active: menu?.is_active ?? true,
	});

	useEffect(() => {
		fetchCategories();
		fetchBeers();
	}, []);

	useEffect(() => {
		fetchBeers();
	}, [searchQuery, categoryFilter]);

	useEffect(() => {
		if (formData.beer_id) {
			const beer = beers.find((b) => b.id === formData.beer_id);
			setSelectedBeer(beer || null);
		}
	}, [formData.beer_id, beers]);

	const fetchCategories = async () => {
		try {
			const response = await fetch("/api/master/beer-categories");
			if (response.ok) {
				const data = await response.json();
				setCategories(data);
			}
		} catch (_error) {}
	};

	const fetchBeers = async () => {
		try {
			const params = new URLSearchParams();
			if (searchQuery) params.append("search", searchQuery);
			if (categoryFilter) params.append("category_id", categoryFilter);

			const response = await fetch(`/api/master/beers?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				setBeers(data);
			}
		} catch (_error) {}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;

		if (type === "checkbox") {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData({
				...formData,
				[name]: checked,
			});
		} else if (name === "beer_id") {
			setFormData({
				...formData,
				[name]: Number(value),
			});
		} else if (name === "price") {
			setFormData({
				...formData,
				[name]: value === "" ? "" : Number(value),
			});
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!formData.beer_id) {
			setError("ビールを選択してください");
			return;
		}

		setLoading(true);

		try {
			const url = isEdit
				? `/api/bars/${barId}/menus/beers/${menu?.id}`
				: `/api/bars/${barId}/menus/beers`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/menus/beers`);
			router.refresh();
		} catch (err) {
			setError("保存に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{/* ビール選択 */}
			<div>
				<label
					htmlFor="beer_id"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					ビール <span className="text-red-500">*</span>
				</label>

				{!isEdit && (
					<>
						{/* 検索・フィルタ */}
						<div className="bg-gray-50 p-4 rounded-md mb-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="search"
										className="block text-xs font-medium text-gray-700 mb-1"
									>
										ビール名で検索
									</label>
									<input
										type="text"
										id="search"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="ビール名を入力..."
										className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									/>
								</div>
								<div>
									<label
										htmlFor="category_filter"
										className="block text-xs font-medium text-gray-700 mb-1"
									>
										カテゴリでフィルタ
									</label>
									<select
										id="category_filter"
										value={categoryFilter}
										onChange={(e) => setCategoryFilter(e.target.value)}
										className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="">全てのカテゴリ</option>
										{categories.map((category) => (
											<option key={category.id} value={category.id}>
												{category.name}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						<select
							id="beer_id"
							name="beer_id"
							required
							value={formData.beer_id}
							onChange={handleChange}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
						>
							<option value="">ビールを選択してください</option>
							{beers.map((beer) => (
								<option key={beer.id} value={beer.id}>
									{beer.name} - {beer.brewery_id ? "醸造所あり" : "醸造所不明"}
								</option>
							))}
						</select>
					</>
				)}

				{/* 選択されたビールの情報表示 */}
				{selectedBeer && (
					<div className="mt-4 bg-blue-50 p-4 rounded-md">
						<h4 className="text-sm font-medium text-gray-900 mb-2">
							選択中のビール情報
						</h4>
						<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
							<div>
								<dt className="font-medium text-gray-700">ビール名:</dt>
								<dd className="text-gray-900">{selectedBeer.name}</dd>
							</div>
							<div>
								<dt className="font-medium text-gray-700">カテゴリ:</dt>
								<dd className="text-gray-900">
									{
										categories.find(
											(c) => c.id === selectedBeer.beer_category_id,
										)?.name
									}
								</dd>
							</div>
							{selectedBeer.abv && (
								<div>
									<dt className="font-medium text-gray-700">アルコール度数:</dt>
									<dd className="text-gray-900">{selectedBeer.abv}%</dd>
								</div>
							)}
							{selectedBeer.ibu && (
								<div>
									<dt className="font-medium text-gray-700">IBU:</dt>
									<dd className="text-gray-900">{selectedBeer.ibu}</dd>
								</div>
							)}
							{selectedBeer.description && (
								<div className="md:col-span-2">
									<dt className="font-medium text-gray-700">説明:</dt>
									<dd className="text-gray-900">{selectedBeer.description}</dd>
								</div>
							)}
						</dl>
					</div>
				)}
			</div>

			{/* 価格 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
						min="0"
						value={formData.price}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="size"
						className="block text-sm font-medium text-gray-700"
					>
						サイズ
					</label>
					<input
						type="text"
						id="size"
						name="size"
						placeholder="例: Mサイズ、パイント"
						value={formData.size}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
			</div>

			{/* 画像URL */}
			<div>
				<label
					htmlFor="image_url"
					className="block text-sm font-medium text-gray-700"
				>
					画像URL（店舗独自の写真）
				</label>
				<input
					type="url"
					id="image_url"
					name="image_url"
					placeholder="https://example.com/image.jpg"
					value={formData.image_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					※未入力の場合はビールマスタの画像が表示されます
				</p>
			</div>

			{/* 説明 */}
			<div>
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					説明（店舗独自のコメント）
				</label>
				<textarea
					id="description"
					name="description"
					rows={4}
					placeholder="例: 当店おすすめの一杯です"
					value={formData.description}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			{/* 提供状況 */}
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
					提供中（チェックを外すと品切れになります）
				</label>
			</div>

			{/* ボタン */}
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
					{loading ? "保存中..." : "保存"}
				</button>
			</div>
		</form>
	);
}
