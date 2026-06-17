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
	onSearch?: (params: {
		city: string;
		categories: string[];
		origin: string;
	}) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
	const [origins, setOrigins] = useState<Record<string, string[]>>({});
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	useEffect(() => {
		const fetchRegions = async () => {
			const result = await getBeerRegions();
			setOrigins(result);
		};
		fetchRegions();
	}, []);

	const handleCityChange = (city: string) => {
		const origin =
			(document.getElementById("origin") as HTMLSelectElement)?.value || "";
		onSearch?.({ city, categories: selectedCategories, origin });
	};

	const handleCategoryToggle = (category: string) => {
		const nextCategories = selectedCategories.includes(category)
			? selectedCategories.filter((c) => c !== category)
			: [...selectedCategories, category];
		setSelectedCategories(nextCategories);

		const city =
			(document.getElementById("city") as HTMLSelectElement)?.value || "";
		const origin =
			(document.getElementById("origin") as HTMLSelectElement)?.value || "";
		onSearch?.({ city, categories: nextCategories, origin });
	};

	const handleOriginChange = (origin: string) => {
		const city =
			(document.getElementById("city") as HTMLSelectElement)?.value || "";
		onSearch?.({ city, categories: selectedCategories, origin });
	};

	return (
		<div
			className="p-6 md:p-8 rounded-2xl modern-shadow animate-fade-in"
			style={{ backgroundColor: "#f0e68c" }}
		>
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
						onChange={(e) => handleCityChange(e.target.value)}
						className="glass-input w-full px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
						style={{ backgroundColor: "#ffffff" }}
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
											: "bg-white text-card-foreground hover:opacity-80"
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
						onChange={(e) => handleOriginChange(e.target.value)}
						className="glass-input w-full px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
						style={{ backgroundColor: "#ffffff" }}
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
