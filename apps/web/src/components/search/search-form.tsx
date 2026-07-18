"use client";

import { Check, Search } from "lucide-react";
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

	const selectClassName =
		"w-full px-4 py-3 rounded-xl bg-surface-control border border-border text-card-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300";

	return (
		<div className="p-5 md:p-7 rounded-[22px] bg-card border border-border modern-shadow animate-fade-in">
			<div className="mb-5">
				<label
					htmlFor="search-keyword"
					className="block text-xs font-medium text-subtext mb-2 tracking-[0.14em] uppercase font-archivo"
				>
					Keyword
				</label>
				<div className="flex gap-2">
					<input
						id="search-keyword"
						type="text"
						placeholder="店名・キーワードで探す"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleKeywordSearch();
							}
						}}
						className="flex-1 px-4 py-3 rounded-xl bg-surface-control border border-border text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
					/>
					<button
						type="button"
						aria-label="検索"
						onClick={handleKeywordSearch}
						className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-strong text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg"
					>
						<Search className="w-5 h-5" strokeWidth={2.5} />
					</button>
				</div>
			</div>

			<div className="mb-5">
				<span className="block text-xs font-medium text-subtext mb-2 tracking-[0.14em] uppercase font-archivo">
					Category
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
								className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
									isSelected
										? "bg-primary text-primary-foreground border-transparent"
										: "bg-secondary text-subtext border-border hover:border-primary/40"
								}`}
							>
								{isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
								{category}
							</button>
						);
					})}
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="city"
						className="block text-xs font-medium text-subtext mb-2 tracking-[0.14em] uppercase font-archivo"
					>
						City
					</label>
					<select
						id="city"
						value={selectedCity}
						onChange={(e) => handleCityChange(e.target.value)}
						className={selectClassName}
					>
						<option value="">市町村（全て）</option>
						{SHIZUOKA_CITIES.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="origin"
						className="block text-xs font-medium text-subtext mb-2 tracking-[0.14em] uppercase font-archivo"
					>
						Origin
					</label>
					<select
						id="origin"
						value={selectedOrigin}
						onChange={(e) => handleOriginChange(e.target.value)}
						className={selectClassName}
					>
						<option value="">産地（全て）</option>
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
