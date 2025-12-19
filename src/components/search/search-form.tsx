"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { PREFECTURES } from "@/lib/constants/prefectures";

interface SearchFormProps {
	onSearch?: (params: {
		query: string;
		prefecture: string;
		category: string;
	}) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
	const [query, setQuery] = useState("");
	const [prefecture, setPrefecture] = useState("");
	const [category, setCategory] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch?.({ query, prefecture, category });
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="glass-card p-6 md:p-8 rounded-2xl modern-shadow animate-fade-in"
		>
			<div className="flex flex-col gap-6">
				<div className="flex gap-3">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="店名・説明・タグで検索"
						className="glass-input flex-1 px-5 py-3.5 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
					/>
					<button
						type="submit"
						className="gradient-primary px-8 py-3.5 text-primary-foreground rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 shadow-md"
						aria-label="検索"
					>
						<Search className="w-5 h-5" />
					</button>
				</div>

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
							value={prefecture}
							onChange={(e) => setPrefecture(e.target.value)}
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
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="glass-input w-full px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
						>
							<option value="">全て</option>
							<option value="ipa">IPA</option>
							<option value="pilsner">ピルスナー</option>
							<option value="stout">スタウト</option>
							<option value="weizen">ヴァイツェン</option>
							<option value="pale_ale">ペールエール</option>
						</select>
					</div>
				</div>
			</div>
		</form>
	);
}
