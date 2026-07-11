"use client";

import Image from "next/image";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { uploadMenuImage } from "@/lib/menu-image-upload";
import type { BeerCategory, Country, Region } from "@/types/database";

interface SizeRow {
	id: number;
	sizeName: string;
	price: string;
}

interface BeerMenuCreateFormProps {
	barId: string;
}

export default function BeerMenuCreateForm({ barId }: BeerMenuCreateFormProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const [countries, setCountries] = useState<Country[]>([]);
	const [regions, setRegions] = useState<Region[]>([]);
	const [beerCategories, setBeerCategories] = useState<BeerCategory[]>([]);

	const [name, setName] = useState("");
	const [beerCategoryId, setBeerCategoryId] = useState("");
	const [countryId, setCountryId] = useState("");
	const [regionId, setRegionId] = useState("");
	const [breweryName, setBreweryName] = useState("");
	const sizeIdCounter = useRef(1);
	const [sizes, setSizes] = useState<SizeRow[]>([
		{ id: 0, sizeName: "", price: "" },
	]);
	const [description, setDescription] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState("");

	const fetchBeerCategories = useCallback(async () => {
		try {
			const res = await fetch("/api/master/beer-categories");
			if (res.ok) {
				const data = await res.json();
				setBeerCategories(data);
			}
		} catch (_error) {
			// noop
		}
	}, []);

	const fetchCountries = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/menus/countries`);
			if (res.ok) {
				const data = await res.json();
				setCountries(data);
			}
		} catch (_error) {
			// noop
		}
	}, [barId]);

	const fetchRegions = useCallback(
		async (cId: string) => {
			try {
				const res = await fetch(
					`/api/bars/${barId}/menus/regions?country_id=${cId}`,
				);
				if (res.ok) {
					const data = await res.json();
					setRegions(data);
				}
			} catch (_error) {
				// noop
			}
		},
		[barId],
	);

	useEffect(() => {
		fetchCountries();
		fetchBeerCategories();
	}, [fetchCountries, fetchBeerCategories]);

	useEffect(() => {
		if (countryId) {
			fetchRegions(countryId);
			setRegionId("");
		} else {
			setRegions([]);
			setRegionId("");
		}
	}, [countryId, fetchRegions]);

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
		setBeerCategoryId("");
		setCountryId("");
		setRegionId("");
		setBreweryName("");
		sizeIdCounter.current = 1;
		setSizes([{ id: 0, sizeName: "", price: "" }]);
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

		if (!beerCategoryId) {
			setError("ビールカテゴリを選択してください");
			return;
		}

		const validSizes = sizes.filter((s) => s.sizeName.trim());
		if (validSizes.length === 0) {
			setError("サイズを1つ以上入力してください");
			return;
		}

		setLoading(true);

		try {
			let imageUrl: string | null = null;

			if (imageFile) {
				const uploadResult = await uploadMenuImage(
					barId,
					imageFile,
					"beer-menu",
				);

				if (!uploadResult.ok) {
					setError(uploadResult.error);
					return;
				}

				imageUrl = uploadResult.url;
			}

			const res = await fetch(`/api/bars/${barId}/menus/beers`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					beer_category_id: beerCategoryId ? Number(beerCategoryId) : null,
					country_id: countryId ? Number(countryId) : null,
					region_id: regionId ? Number(regionId) : null,
					brewery_name: breweryName.trim() || null,
					sizes: validSizes.map((s, i) => ({
						size_name: s.sizeName.trim(),
						price: s.price ? Number(s.price) : null,
						sort_order: i,
					})),
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
					<p className="text-sm text-green-800">ビールメニューを登録しました</p>
				</div>
			)}

			<div>
				<label
					htmlFor="beer-name"
					className="block text-sm font-medium text-gray-700"
				>
					メニュー名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="beer-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="IPA Revolution"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="beer-category"
					className="block text-sm font-medium text-gray-700"
				>
					ビールカテゴリ <span className="text-red-500">*</span>
				</label>
				<select
					id="beer-category"
					value={beerCategoryId}
					onChange={(e) => setBeerCategoryId(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				>
					<option value="">選択してください</option>
					{beerCategories.map((cat) => (
						<option key={cat.id} value={cat.id}>
							{cat.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label
					htmlFor="country"
					className="block text-sm font-medium text-gray-700"
				>
					国
				</label>
				<select
					id="country"
					value={countryId}
					onChange={(e) => setCountryId(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				>
					<option value="">選択してください</option>
					{countries.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label
					htmlFor="region"
					className="block text-sm font-medium text-gray-700"
				>
					産地
				</label>
				<select
					id="region"
					value={regionId}
					onChange={(e) => setRegionId(e.target.value)}
					disabled={!countryId}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm disabled:bg-gray-100 disabled:text-gray-400"
				>
					<option value="">
						{countryId ? "選択してください" : "国を先に選択してください"}
					</option>
					{regions.map((r) => (
						<option key={r.id} value={r.id}>
							{r.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label
					htmlFor="brewery"
					className="block text-sm font-medium text-gray-700"
				>
					醸造所
				</label>
				<input
					type="text"
					id="brewery"
					value={breweryName}
					onChange={(e) => setBreweryName(e.target.value)}
					placeholder="ベアードブルーイング"
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				/>
			</div>

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
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
							/>
							<input
								type="number"
								value={size.price}
								onChange={(e) => updateSizeRow(index, "price", e.target.value)}
								placeholder="900"
								min="0"
								className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
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
					htmlFor="beer-description"
					className="block text-sm font-medium text-gray-700"
				>
					説明
				</label>
				<textarea
					id="beer-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={4}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="beer-image"
					className="block text-sm font-medium text-gray-700"
				>
					画像
				</label>
				<input
					type="file"
					id="beer-image"
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
