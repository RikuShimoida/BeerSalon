"use client";

import { useEffect, useState } from "react";
import { getBeerRegions } from "@/actions/bar";
import { SHIZUOKA_CITIES } from "@/lib/constants/cities";

interface SearchFormProps {
	onSearch?: (params: {
		city: string;
		category: string;
		origin: string;
	}) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
	const [origins, setOrigins] = useState<Record<string, string[]>>({});

	useEffect(() => {
		const fetchRegions = async () => {
			const result = await getBeerRegions();
			console.log("getBeerRegions result:", result);
			console.log("Number of countries:", Object.keys(result).length);
			setOrigins(result);
		};
		fetchRegions();
	}, []);

	const handleCityChange = (city: string) => {
		const category =
			(document.getElementById("category") as HTMLSelectElement)?.value || "";
		const origin =
			(document.getElementById("origin") as HTMLSelectElement)?.value || "";
		onSearch?.({ city, category, origin });
	};

	const handleCategoryChange = (category: string) => {
		const city =
			(document.getElementById("city") as HTMLSelectElement)?.value || "";
		const origin =
			(document.getElementById("origin") as HTMLSelectElement)?.value || "";
		onSearch?.({ city, category, origin });
	};

	const handleOriginChange = (origin: string) => {
		const city =
			(document.getElementById("city") as HTMLSelectElement)?.value || "";
		const category =
			(document.getElementById("category") as HTMLSelectElement)?.value || "";
		onSearch?.({ city, category, origin });
	};

	return (
		<div className="glass-card p-6 md:p-8 rounded-2xl modern-shadow animate-fade-in">
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
					>
						<option value="">全て</option>
						{SHIZUOKA_CITIES.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="category"
						className="block text-sm font-medium text-card-foreground mb-2 tracking-wide"
					>
						ビールカテゴリ
					</label>
					<select
						id="category"
						onChange={(e) => handleCategoryChange(e.target.value)}
						className="glass-input w-full px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
					>
						<option value="">全て</option>
						<option value="IPA">IPA</option>
						<option value="ピルスナー">ピルスナー</option>
						<option value="スタウト">スタウト</option>
						<option value="ヴァイツェン">ヴァイツェン</option>
						<option value="ペールエール">ペールエール</option>
					</select>
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
