"use client";

import { useEffect, useState } from "react";
import type { BarLocation } from "@/app/actions";
import { getFilteredBarsWithLocation } from "@/app/actions";
import { BarList } from "@/components/bar/bar-list";
import { FooterLinks } from "@/components/home/footer-links";
import { LearnAboutCraftBeerCard } from "@/components/home/learn-about-craft-beer-card";
import { PopularArticlesSection } from "@/components/home/popular-articles-section";
import { PopularBarsSection } from "@/components/home/popular-bars-section";
import { PopularCategoriesSection } from "@/components/home/popular-categories-section";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { PopularRegionsSection } from "@/components/home/popular-regions-section";
import { GoogleMap } from "@/components/map/google-map";
import { SearchForm } from "@/components/search/search-form";

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
	const [bars, setBars] = useState<BarLocation[]>([]);
	const [_isLoadingBars, setIsLoadingBars] = useState(true);

	useEffect(() => {
		const fetchBars = async () => {
			setIsLoadingBars(true);
			try {
				const categoryId = searchParams.category
					? Number(searchParams.category)
					: undefined;
				const data = await getFilteredBarsWithLocation({
					city: searchParams.city || undefined,
					categoryId,
				});
				setBars(data);
			} catch (error) {
				console.error("店舗データの取得に失敗しました:", error);
				setBars([]);
			} finally {
				setIsLoadingBars(false);
			}
		};

		fetchBars();
	}, [searchParams.city, searchParams.category]);

	const handleSearch = (params: {
		city: string;
		category: string;
		origin: string;
	}) => {
		setSearchParams(params);
	};

	const mockPopularArticles = [
		{
			id: 1,
			title: "新しいIPAが入荷しました！ホップの香りが最高です",
			barName: "クラフトビアバー 静岡",
			publishedAt: "2025-12-15",
			likeCount: 42,
			imageUrl:
				"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop",
		},
		{
			id: 2,
			title: "冬季限定スタウト登場 - 濃厚な味わいをお楽しみください",
			barName: "ブルワリータップ 浜松",
			publishedAt: "2025-12-20",
			likeCount: 38,
			imageUrl:
				"https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=800&h=600&fit=crop",
		},
		{
			id: 3,
			title: "週末はハッピーアワー実施中！お得にクラフトビールを",
			barName: "ビアホール 沼津",
			publishedAt: "2025-12-25",
			likeCount: 35,
			imageUrl:
				"https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&h=600&fit=crop",
		},
	];

	const mockPopularBars = [
		{
			id: 1,
			name: "クラフトビアバー 静岡",
			rank: 1,
			href: "/bars/1",
			imageUrl:
				"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop",
		},
		{
			id: 2,
			name: "ブルワリータップ 浜松",
			rank: 2,
			href: "/bars/2",
			imageUrl:
				"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
		},
		{
			id: 3,
			name: "ビアホール 沼津",
			rank: 3,
			href: "/bars/3",
			imageUrl:
				"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
		},
	];

	const mockPopularCities = [
		{
			id: "shizuoka",
			name: "静岡市",
			rank: 1,
			href: "/?city=静岡市",
			imageUrl:
				"https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=600&fit=crop",
		},
		{
			id: "hamamatsu",
			name: "浜松市",
			rank: 2,
			href: "/?city=浜松市",
			imageUrl:
				"https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop",
		},
		{
			id: "numazu",
			name: "沼津市",
			rank: 3,
			href: "/?city=沼津市",
			imageUrl:
				"https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&h=600&fit=crop",
		},
	];

	const mockPopularCategories = [
		{
			id: 1,
			name: "IPA",
			rank: 1,
			href: "/?cat=1",
			imageUrl:
				"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop",
		},
		{
			id: 2,
			name: "ペールエール",
			rank: 2,
			href: "/?cat=2",
			imageUrl:
				"https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&h=600&fit=crop",
		},
		{
			id: 3,
			name: "スタウト",
			rank: 3,
			href: "/?cat=3",
			imageUrl:
				"https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=800&h=600&fit=crop",
		},
	];

	const mockPopularRegions = [
		{
			id: 1,
			name: "アメリカ・西海岸",
			rank: 1,
			href: "/?region=1",
			imageUrl:
				"https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop",
		},
		{
			id: 2,
			name: "ベルギー・フランダース",
			rank: 2,
			href: "/?region=2",
			imageUrl:
				"https://images.unsplash.com/photo-1551801841-ecad875a5142?w=800&h=600&fit=crop",
		},
		{
			id: 3,
			name: "日本・静岡",
			rank: 3,
			href: "/?region=3",
			imageUrl:
				"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
		},
	];

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
			<div className="flex flex-col gap-8 md:gap-12">
				{/* 検索セクション */}
				<SearchForm onSearch={handleSearch} />

				{/* 地図エリア */}
				<GoogleMap city={searchParams.city} bars={bars} />

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
				<PopularBarsSection title="人気なお店で探す" bars={mockPopularBars} />

				{/* 人気な市町村で探す */}
				<PopularCitiesSection
					title="人気な市町村で探す"
					cities={mockPopularCities}
				/>

				{/* 人気なカテゴリのビールで探す */}
				<PopularCategoriesSection
					title="人気なカテゴリのビールで探す"
					categories={mockPopularCategories}
				/>

				{/* 人気なビールの産地で探す */}
				<PopularRegionsSection
					title="人気なビールの産地で探す"
					regions={mockPopularRegions}
				/>

				{/* 利用規約エリア */}
				<FooterLinks />
			</div>
		</div>
	);
}
