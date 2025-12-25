"use client";

import { PREFECTURES } from "@/lib/constants/prefectures";

interface SearchFormProps {
	onSearch?: (params: { prefecture: string; category: string }) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
	const handlePrefectureChange = (prefecture: string) => {
		const category =
			(document.getElementById("category") as HTMLSelectElement)?.value || "";
		onSearch?.({ prefecture, category });
	};

	const handleCategoryChange = (category: string) => {
		const prefecture =
			(document.getElementById("prefecture") as HTMLSelectElement)?.value || "";
		onSearch?.({ prefecture, category });
	};

	return (
		<div className="glass-card p-6 md:p-8 rounded-2xl modern-shadow animate-fade-in">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="prefecture"
						className="block text-sm font-medium text-card-foreground mb-2 tracking-wide"
					>
						都道府県
					</label>
					<select
						id="prefecture"
						onChange={(e) => handlePrefectureChange(e.target.value)}
						className="glass-input w-full px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
					>
						<option value="">全て</option>
						{PREFECTURES.map((pref) => (
							<option key={pref} value={pref}>
								{pref}
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
			</div>
		</div>
	);
}
