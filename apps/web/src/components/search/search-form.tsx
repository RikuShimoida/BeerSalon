"use client";

import { useEffect, useState } from "react";
import { getBeerRegions } from "@/actions/bar";
import { SHIZUOKA_CITIES } from "@/lib/constants/cities";

const BEER_CATEGORIES = [
	"IPA",
	"ピルスナー",
	"スタウト",
	"ヴァイツェン",
	"ペールエール",
];

interface SearchFormProps {
	initialValues?: {
		q?: string;
		city?: string;
		categories?: string[];
		origin?: string;
	};
	onSearch?: (params: {
		q: string;
		city: string;
		categories: string[];
		origin: string;
	}) => void;
}

export function SearchForm({ initialValues, onSearch }: SearchFormProps) {
	const [origins, setOrigins] = useState<Record<string, string[]>>({});
	const [query, setQuery] = useState(initialValues?.q ?? "");
	const [selectedCity, setSelectedCity] = useState(initialValues?.city ?? "");
	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		initialValues?.categories ?? [],
	);
	const [selectedOrigin, setSelectedOrigin] = useState(
		initialValues?.origin ?? "",
	);

	useEffect(() => {
		const fetchRegions = async () => {
			const result = await getBeerRegions();
			setOrigins(result);
		};
		fetchRegions();
	}, []);

	const handleKeywordSearch = () => {
		onSearch?.({
			q: query,
			city: selectedCity,
			categories: selectedCategories,
			origin: selectedOrigin,
		});
	};

	const handleCityChange = (city: string) => {
		setSelectedCity(city);
		onSearch?.({
			q: query,
			city,
			categories: selectedCategories,
			origin: selectedOrigin,
		});
	};

	const handleCategoryToggle = (category: string) => {
		const nextCategories = selectedCategories.includes(category)
			? selectedCategories.filter((c) => c !== category)
			: [...selectedCategories, category];
		setSelectedCategories(nextCategories);
		onSearch?.({
			q: query,
			city: selectedCity,
			categories: nextCategories,
			origin: selectedOrigin,
		});
	};

	const handleOriginChange = (origin: string) => {
		setSelectedOrigin(origin);
		onSearch?.({
			q: query,
			city: selectedCity,
			categories: selectedCategories,
			origin,
		});
	};

	return (
		<div className="p-6 md:p-8 rounded-2xl modern-shadow animate-fade-in bg-surface-panel">
			<div className="mb-4">
				<label
					htmlFor="search-keyword"
					className="block text-sm font-medium text-card-foreground mb-2 tracking-wide"
				>
					キーワードで探す
				</label>
				<div className="flex gap-2">
					<input
						id="search-keyword"
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleKeywordSearch();
							}
						}}
						className="flex-1 px-4 py-3 rounded-xl bg-surface-control backdrop-blur-sm border border-border/30 text-card-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
					/>
					<button
						type="button"
						aria-label="検索"
						onClick={handleKeywordSearch}
						className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all duration-300 hover:opacity-80"
					>
						🔍
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				<div>
					<label
						htmlFor="city"
						className="block text-sm font-medium text-card-foreground mb-2 tracking-wide"
					>
						市町村
					</label>
					<select
						id="city"
						value={selectedCity}
						onChange={(e) => handleCityChange(e.target.value)}
						className="w-full px-4 py-3 rounded-xl bg-surface-control backdrop-blur-sm border border-border/30 text-card-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
					>
						<option value="">全て</option>
						{SHIZUOKA_CITIES.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</select>
				</div>

				<div className="col-span-2 md:col-span-1">
					<span className="block text-sm font-medium text-card-foreground mb-2 tracking-wide">
						ビールカテゴリ（複数選択可）
					</span>
					<div className="flex flex-wrap gap-2">
						{BEER_CATEGORIES.map((category) => {
							const isSelected = selectedCategories.includes(category);
							return (
								<button
									key={category}
									type="button"
									aria-pressed={isSelected}
									onClick={() => handleCategoryToggle(category)}
									className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
										isSelected
											? "bg-primary text-primary-foreground"
											: "bg-surface-control text-card-foreground hover:opacity-80"
									}`}
								>
									{isSelected ? `✓ ${category}` : category}
								</button>
							);
						})}
					</div>
				</div>

				<div>
					<label
						htmlFor="origin"
						className="block text-sm font-medium text-card-foreground mb-2 tracking-wide"
					>
						ビールの地域
					</label>
					<select
						id="origin"
						value={selectedOrigin}
						onChange={(e) => handleOriginChange(e.target.value)}
						className="w-full px-4 py-3 rounded-xl bg-surface-control backdrop-blur-sm border border-border/30 text-card-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
					>
						<option value="">全て</option>
						{Object.entries(origins).map(([country, regions]) => (
							<optgroup key={country} label={country}>
								{regions.map((region) => (
									<option
										key={`${country}/${region}`}
										value={`${country}/${region}`}
									>
										{region}
									</option>
								))}
							</optgroup>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}
