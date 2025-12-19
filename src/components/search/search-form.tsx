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
		<form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-md">
			<div className="flex flex-col gap-4">
				<div className="flex gap-2">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="店名・説明・タグで検索"
						className="flex-1 px-4 py-3 border border-border/50 bg-card-foreground/5 rounded-lg text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
					/>
					<button
						type="submit"
						className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
						aria-label="検索"
					>
						<Search className="w-5 h-5" />
					</button>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="prefecture"
							className="block text-sm font-medium text-card-foreground mb-2"
						>
							都道府県
						</label>
						<select
							id="prefecture"
							value={prefecture}
							onChange={(e) => setPrefecture(e.target.value)}
							className="w-full px-4 py-3 border border-border/50 bg-card-foreground/5 rounded-lg text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
							className="block text-sm font-medium text-card-foreground mb-2"
						>
							ビールカテゴリ
						</label>
						<select
							id="category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="w-full px-4 py-3 border border-border/50 bg-card-foreground/5 rounded-lg text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
