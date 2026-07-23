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
		origins?: string[];
	};
	onSearch?: (params: {
		q: string;
		city: string;
		categories: string[];
		origins: string[];
	}) => void;
}

export function SearchForm({ initialValues, onSearch }: SearchFormProps) {
	const [origins, setOrigins] = useState<Record<string, string[]>>({});
	const [query, setQuery] = useState(initialValues?.q ?? "");
	const [selectedCity, setSelectedCity] = useState(initialValues?.city ?? "");
	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		initialValues?.categories ?? [],
	);
	const [selectedOrigins, setSelectedOrigins] = useState<string[]>(
		initialValues?.origins ?? [],
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
			origins: selectedOrigins,
		});
	};

	const handleCityChange = (city: string) => {
		setSelectedCity(city);
		onSearch?.({
			q: query,
			city,
			categories: selectedCategories,
			origins: selectedOrigins,
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
			origins: selectedOrigins,
		});
	};

	const handleOriginToggle = (origin: string) => {
		const nextOrigins = selectedOrigins.includes(origin)
			? selectedOrigins.filter((o) => o !== origin)
			: [...selectedOrigins, origin];
		setSelectedOrigins(nextOrigins);
		onSearch?.({
			q: query,
			city: selectedCity,
			categories: selectedCategories,
			origins: nextOrigins,
		});
	};

	const chipClassName = (isSelected: boolean) =>
		`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
			isSelected
				? "bg-primary text-primary-foreground border-transparent"
				: "bg-secondary text-subtext border-border hover:border-primary/40"
		}`;

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
								className={chipClassName(isSelected)}
							>
								{isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
								{category}
							</button>
						);
					})}
				</div>
			</div>

			<div className="mb-5">
				<span className="block text-xs font-medium text-subtext mb-2 tracking-[0.14em] uppercase font-archivo">
					Origin
				</span>
				<div className="flex flex-col gap-3">
					{Object.entries(origins).map(([country, regions]) => (
						<div key={country}>
							<span className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
								{country}
							</span>
							<div className="flex flex-wrap gap-2">
								{regions.map((region) => {
									const value = `${country}/${region}`;
									const isSelected = selectedOrigins.includes(value);
									return (
										<button
											key={value}
											type="button"
											aria-pressed={isSelected}
											onClick={() => handleOriginToggle(value)}
											className={chipClassName(isSelected)}
										>
											{isSelected && (
												<Check className="w-4 h-4" strokeWidth={3} />
											)}
											{region}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>

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
		</div>
	);
}
