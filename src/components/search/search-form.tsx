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
		<form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
			<div className="flex flex-col gap-4">
				{/* テキスト検索バー */}
				<div className="flex gap-2">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="店名・説明・タグで検索"
						className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						aria-label="検索"
					>
						<Search className="w-5 h-5" />
					</button>
				</div>

				{/* フィルター */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="prefecture"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							都道府県
						</label>
						<select
							id="prefecture"
							value={prefecture}
							onChange={(e) => setPrefecture(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							ビールカテゴリ
						</label>
						<select
							id="category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
