"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import type { BarBeerMenuDetail } from "@/types/database";

interface SizeRow {
	id: number;
	sizeName: string;
	price: string;
}

interface BeerMenuFormProps {
	barId: string;
	menu?: BarBeerMenuDetail;
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

	const sizeIdCounter = useRef(menu?.sizes?.length ?? 1);
	const [sizes, setSizes] = useState<SizeRow[]>(() => {
		if (menu?.sizes && menu.sizes.length > 0) {
			return menu.sizes.map((s, i) => ({
				id: i,
				sizeName: s.size_name,
				price: s.price?.toString() ?? "",
			}));
		}
		return [{ id: 0, sizeName: "", price: "" }];
	});

	const [description, setDescription] = useState(menu?.description ?? "");
	const [imageUrl, setImageUrl] = useState(menu?.image_url ?? "");
	const [isActive, setIsActive] = useState(menu?.is_active ?? true);

	const addSizeRow = () => {
		const newId = sizeIdCounter.current;
		sizeIdCounter.current += 1;
		setSizes([...sizes, { id: newId, sizeName: "", price: "" }]);
	};

	const removeSizeRow = (index: number) => {
		if (sizes.length <= 1) return;
		setSizes(sizes.filter((_, i) => i !== index));
	};

	const updateSizeRow = (
		index: number,
		field: keyof SizeRow,
		value: string,
	) => {
		const updated = [...sizes];
		updated[index] = { ...updated[index], [field]: value };
		setSizes(updated);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		const validSizes = sizes.filter((s) => s.sizeName.trim());
		if (validSizes.length === 0) {
			setError("サイズを1つ以上入力してください");
			return;
		}

		setLoading(true);

		try {
			const url = `/api/bars/${barId}/menus/beers/${menu?.id}`;

			const response = await fetch(url, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description: description.trim() || null,
					image_url: imageUrl.trim() || null,
					is_active: isActive,
					sizes: validSizes.map((s, i) => ({
						size_name: s.sizeName.trim(),
						price: s.price ? Number(s.price) : null,
						sort_order: i,
					})),
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/menus`);
			router.refresh();
		} catch (_err) {
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

			{menu?.beer && (
				<div className="bg-blue-50 p-4 rounded-md">
					<h4 className="text-sm font-medium text-gray-900 mb-2">
						ビール情報
					</h4>
					<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
						<div>
							<dt className="font-medium text-gray-700">ビール名:</dt>
							<dd className="text-gray-900">{menu.beer.name}</dd>
						</div>
						{menu.beer.category && (
							<div>
								<dt className="font-medium text-gray-700">カテゴリ:</dt>
								<dd className="text-gray-900">{menu.beer.category.name}</dd>
							</div>
						)}
						{menu.beer.brewery && (
							<div>
								<dt className="font-medium text-gray-700">醸造所:</dt>
								<dd className="text-gray-900">{menu.beer.brewery.name}</dd>
							</div>
						)}
						{menu.beer.region && (
							<div>
								<dt className="font-medium text-gray-700">産地:</dt>
								<dd className="text-gray-900">{menu.beer.region.name}</dd>
							</div>
						)}
					</dl>
				</div>
			)}

			<fieldset>
				<legend className="block text-sm font-medium text-gray-700 mb-2">
					サイズ / 価格
				</legend>
				<div className="space-y-3">
					{sizes.map((size, index) => (
						<div key={size.id} className="flex items-center gap-2">
							<input
								type="text"
								value={size.sizeName}
								onChange={(e) =>
									updateSizeRow(index, "sizeName", e.target.value)
								}
								placeholder="パイント"
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
							/>
							<input
								type="number"
								value={size.price}
								onChange={(e) => updateSizeRow(index, "price", e.target.value)}
								placeholder="900"
								min="0"
								className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
							/>
							<span className="text-sm text-gray-500">円</span>
							{sizes.length > 1 && (
								<button
									type="button"
									onClick={() => removeSizeRow(index)}
									className="p-2 text-red-500 hover:text-red-700 transition-colors text-lg leading-none"
									aria-label="この行を削除"
								>
									&times;
								</button>
							)}
						</div>
					))}
				</div>
				<button
					type="button"
					onClick={addSizeRow}
					className="mt-3 text-sm text-gray-600 hover:text-black transition-colors underline"
				>
					サイズ/価格を追加
				</button>
			</fieldset>

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
					value={imageUrl}
					onChange={(e) => setImageUrl(e.target.value)}
					placeholder="https://example.com/image.jpg"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					※未入力の場合はビールマスタの画像が表示されます
				</p>
			</div>

			<div>
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					説明（店舗独自のコメント）
				</label>
				<textarea
					id="description"
					rows={4}
					placeholder="例: 当店おすすめの一杯です"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div className="flex items-center">
				<input
					type="checkbox"
					id="is_active"
					checked={isActive}
					onChange={(e) => setIsActive(e.target.checked)}
					className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
					提供中（チェックを外すと品切れになります）
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
					{loading ? "保存中..." : "保存"}
				</button>
			</div>
		</form>
	);
}
