"use client";

import { useEffect, useState } from "react";
import { BarList } from "@/components/bar/bar-list";
import { FooterLinks } from "@/components/home/footer-links";
import { LearnAboutCraftBeerCard } from "@/components/home/learn-about-craft-beer-card";
import { PopularArticlesSection } from "@/components/home/popular-articles-section";
import { PopularRankingSection } from "@/components/home/popular-ranking-section";
import { GoogleMap } from "@/components/map/google-map";
import { SearchForm } from "@/components/search/search-form";
import { createClient } from "@/lib/supabase/client";

export function HomeClient() {
	const [searchParams, setSearchParams] = useState<{
		city: string;
		category: string;
		origin: string;
	}>({
		city: "",
		category: "",
		origin: "",
	});

	const handleSearch = (params: {
		city: string;
		category: string;
		origin: string;
	}) => {
		setSearchParams(params);
	};

	const supabase = createClient();

	const [barImageUrls, setBarImageUrls] = useState<Record<number, string>>({});
	const [cityImageUrls, setCityImageUrls] = useState<Record<string, string>>(
		{},
	);
	const [categoryImageUrls, setCategoryImageUrls] = useState<
		Record<number, string>
	>({});
	const [regionImageUrls, setRegionImageUrls] = useState<
		Record<number, string>
	>({});

	useEffect(() => {
		const fetchImageUrls = async () => {
			// Fetch bar images
			const barUrls: Record<number, string> = {};
			for (const id of [1, 2, 3]) {
				const { data } = supabase.storage
					.from("content-images")
					.getPublicUrl(`popular-bars/${id}.svg`);
				if (data?.publicUrl) {
					barUrls[id] = data.publicUrl;
				}
			}
			setBarImageUrls(barUrls);

			// Fetch city images
			const cityUrls: Record<string, string> = {};
			for (const id of ["shizuoka", "hamamatsu", "numazu"]) {
				const { data } = supabase.storage
					.from("content-images")
					.getPublicUrl(`popular-cities/${id}.svg`);
				if (data?.publicUrl) {
					cityUrls[id] = data.publicUrl;
				}
			}
			setCityImageUrls(cityUrls);

			// Fetch category images
			const categoryUrls: Record<number, string> = {};
			for (const id of [1, 2, 3]) {
				const { data } = supabase.storage
					.from("content-images")
					.getPublicUrl(`popular-categories/${id}.svg`);
				if (data?.publicUrl) {
					categoryUrls[id] = data.publicUrl;
				}
			}
			setCategoryImageUrls(categoryUrls);

			// Fetch region images
			const regionUrls: Record<number, string> = {};
			for (const id of [1, 2, 3]) {
				const { data } = supabase.storage
					.from("content-images")
					.getPublicUrl(`popular-regions/${id}.svg`);
				if (data?.publicUrl) {
					regionUrls[id] = data.publicUrl;
				}
			}
			setRegionImageUrls(regionUrls);
		};

		fetchImageUrls();
	}, [supabase]);

	const mockPopularArticles = [
		{
			id: 1,
			title: "新しいIPAが入荷しました！ホップの香りが最高です",
			barName: "クラフトビアバー 静岡",
			publishedAt: "2025-12-15",
			likeCount: 42,
			imageUrl: null,
		},
		{
			id: 2,
			title: "冬季限定スタウト登場 - 濃厚な味わいをお楽しみください",
			barName: "ブルワリータップ 浜松",
			publishedAt: "2025-12-20",
			likeCount: 38,
			imageUrl: null,
		},
		{
			id: 3,
			title: "週末はハッピーアワー実施中！お得にクラフトビールを",
			barName: "ビアホール 沼津",
			publishedAt: "2025-12-25",
			likeCount: 35,
			imageUrl: null,
		},
	];

	const mockPopularBars = [
		{
			id: 1,
			name: "クラフトビアバー 静岡",
			rank: 1,
			href: "/bars/1",
			imageUrl: barImageUrls[1],
		},
		{
			id: 2,
			name: "ブルワリータップ 浜松",
			rank: 2,
			href: "/bars/2",
			imageUrl: barImageUrls[2],
		},
		{
			id: 3,
			name: "ビアホール 沼津",
			rank: 3,
			href: "/bars/3",
			imageUrl: barImageUrls[3],
		},
	];

	const mockPopularCities = [
		{
			id: "shizuoka",
			name: "静岡市",
			rank: 1,
			href: "/?city=静岡市",
			imageUrl: cityImageUrls.shizuoka,
		},
		{
			id: "hamamatsu",
			name: "浜松市",
			rank: 2,
			href: "/?city=浜松市",
			imageUrl: cityImageUrls.hamamatsu,
		},
		{
			id: "numazu",
			name: "沼津市",
			rank: 3,
			href: "/?city=沼津市",
			imageUrl: cityImageUrls.numazu,
		},
	];

	const mockPopularCategories = [
		{
			id: 1,
			name: "IPA",
			rank: 1,
			href: "/?cat=1",
			imageUrl: categoryImageUrls[1],
		},
		{
			id: 2,
			name: "ペールエール",
			rank: 2,
			href: "/?cat=2",
			imageUrl: categoryImageUrls[2],
		},
		{
			id: 3,
			name: "スタウト",
			rank: 3,
			href: "/?cat=3",
			imageUrl: categoryImageUrls[3],
		},
	];

	const mockPopularRegions = [
		{
			id: 1,
			name: "アメリカ・西海岸",
			rank: 1,
			href: "/?region=1",
			imageUrl: regionImageUrls[1],
		},
		{
			id: 2,
			name: "ベルギー・フランダース",
			rank: 2,
			href: "/?region=2",
			imageUrl: regionImageUrls[2],
		},
		{
			id: 3,
			name: "日本・静岡",
			rank: 3,
			href: "/?region=3",
			imageUrl: regionImageUrls[3],
		},
	];

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
			<div className="flex flex-col gap-8 md:gap-12">
				{/* 検索セクション */}
				<SearchForm onSearch={handleSearch} />

				{/* 地図エリア */}
				<GoogleMap city={searchParams.city} />

				{/* 店舗一覧 */}
				<BarList
					city={searchParams.city}
					category={searchParams.category}
					origin={searchParams.origin}
				/>

				{/* クラフトビールについて知る */}
				<LearnAboutCraftBeerCard />

				{/* 先月いいねの多かった記事 */}
				<PopularArticlesSection articles={mockPopularArticles} />

				{/* 人気なお店で探す */}
				<PopularRankingSection
					title="人気なお店で探す"
					items={mockPopularBars}
				/>

				{/* 人気な市町村で探す */}
				<PopularRankingSection
					title="人気な市町村で探す"
					items={mockPopularCities}
				/>

				{/* 人気なカテゴリのビールで探す */}
				<PopularRankingSection
					title="人気なカテゴリのビールで探す"
					items={mockPopularCategories}
				/>

				{/* 人気なビールの産地で探す */}
				<PopularRankingSection
					title="人気なビールの産地で探す"
					items={mockPopularRegions}
				/>

				{/* 利用規約エリア */}
				<FooterLinks />
			</div>
		</div>
	);
}
