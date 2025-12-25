"use client";

import { useState } from "react";
import { BarList } from "@/components/bar/bar-list";
import { GoogleMap } from "@/components/map/google-map";
import { SearchForm } from "@/components/search/search-form";

export function HomeClient() {
	const [searchParams, setSearchParams] = useState<{
		prefecture: string;
		category: string;
	}>({
		prefecture: "",
		category: "",
	});

	const handleSearch = (params: { prefecture: string; category: string }) => {
		setSearchParams(params);
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
			<div className="flex flex-col gap-8 md:gap-12">
				{/* 検索セクション */}
				<SearchForm onSearch={handleSearch} />

				{/* 地図エリア */}
				<GoogleMap prefecture={searchParams.prefecture} />

				{/* 店舗一覧 */}
				<BarList
					prefecture={searchParams.prefecture}
					category={searchParams.category}
				/>
			</div>
		</div>
	);
}
