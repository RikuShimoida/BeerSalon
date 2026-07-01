"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBars } from "@/actions/bar";
import { BarList } from "@/components/bar/bar-list";
import type { BarSummary } from "@/components/bar/bar-summary";
import { FooterLinks } from "@/components/home/footer-links";
import { LearnAboutCraftBeerCard } from "@/components/home/learn-about-craft-beer-card";
import { PopularArticlesSection } from "@/components/home/popular-articles-section";
import { PopularBarsSection } from "@/components/home/popular-bars-section";
import { PopularCategoriesSection } from "@/components/home/popular-categories-section";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { PopularRegionsSection } from "@/components/home/popular-regions-section";
import { GoogleMap } from "@/components/map/google-map";
import { SearchForm } from "@/components/search/search-form";
import {
	buildSearchQueryString,
	parseSearchParams,
} from "@/lib/search/query-params";

export function HomeClient() {
	const router = useRouter();
	const urlSearchParams = useSearchParams();
	const urlQuery = urlSearchParams.get("q") ?? "";
	const urlCity = urlSearchParams.get("city") ?? "";

	const [searchParams, setSearchParams] = useState<{
		q: string;
		city: string;
		categories: string[];
		origin: string;
	}>(() => parseSearchParams(urlSearchParams));

	// Why not: useState 初期化関数は初回マウントのみ実行されるため、ブラウザバック等で
	// URL だけが変わるケースに追従できない。URL を真実の源とし、URL の q/city が変わったら
	// state を同期する。
	useEffect(() => {
		setSearchParams((prev) => ({
			...prev,
			q: urlQuery,
			city: urlCity,
		}));
	}, [urlQuery, urlCity]);

	// Why not: マップと店舗一覧が別々に getBars を呼ぶと、同一検索条件でも取得タイミングの
	// ズレで表示がリンクしなくなる。親で一度だけ取得し、両者へ同じ結果を配ってデータソースを
	// 一本化する。
	const [bars, setBars] = useState<BarSummary[]>([]);
	const [isBarsLoading, setIsBarsLoading] = useState(true);

	const categoriesKey = searchParams.categories.join(",");

	useEffect(() => {
		let isCurrent = true;
		const fetchBars = async () => {
			setIsBarsLoading(true);
			const result = await getBars({
				q: searchParams.q,
				city: searchParams.city,
				categories: categoriesKey ? categoriesKey.split(",") : [],
				origin: searchParams.origin,
			});
			if (!isCurrent) return;
			setBars(result);
			setIsBarsLoading(false);
		};

		fetchBars();
		return () => {
			isCurrent = false;
		};
	}, [searchParams.q, searchParams.city, categoriesKey, searchParams.origin]);

	const handleSearch = (params: {
		q: string;
		city: string;
		categories: string[];
		origin: string;
	}) => {
		setSearchParams(params);

		const queryString = buildSearchQueryString({
			q: params.q,
			city: params.city,
		});
		router.replace(queryString ? `/?${queryString}` : "/", {
			scroll: false,
		});
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
				{/* Why not: 制御 input の value を毎レンダリング上書きすると入力中のIME変換が
				    途切れるため、URL の q/city が変わったときだけ key で再マウントして初期値を反映する。 */}
				<SearchForm
					key={`${urlQuery}|${urlCity}`}
					initialValues={searchParams}
					onSearch={handleSearch}
				/>

				{/* 地図エリア */}
				<GoogleMap city={searchParams.city} bars={bars} />

				{/* 店舗一覧 */}
				<BarList bars={bars} isLoading={isBarsLoading} />

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
