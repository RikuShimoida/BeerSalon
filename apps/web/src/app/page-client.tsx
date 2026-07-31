"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBars } from "@/actions/bar";
import { BarList } from "@/components/bar/bar-list";
import type { BarSummary } from "@/components/bar/bar-summary";
import { PopularCategoriesScroll } from "@/components/home/popular-categories-scroll";
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
	const urlCat = urlSearchParams.get("cat") ?? "";
	const urlOrigin = urlSearchParams.get("origin") ?? "";

	const [searchParams, setSearchParams] = useState<{
		q: string;
		city: string;
		categories: string[];
		origins: string[];
	}>(() => parseSearchParams(urlSearchParams));

	// Why not: useState 初期化関数は初回マウントのみ実行されるため、ブラウザバック等で
	// URL だけが変わるケースに追従できない。URL を真実の源とし、URL の q/city/cat/origin が
	// 変わったら state を同期する。
	useEffect(() => {
		setSearchParams(
			parseSearchParams(new URLSearchParams(urlSearchParams.toString())),
		);
	}, [urlSearchParams]);

	// Why not: マップと店舗一覧が別々に getBars を呼ぶと、同一検索条件でも取得タイミングの
	// ズレで表示がリンクしなくなる。親で一度だけ取得し、両者へ同じ結果を配ってデータソースを
	// 一本化する。
	const [bars, setBars] = useState<BarSummary[]>([]);
	const [isBarsLoading, setIsBarsLoading] = useState(true);

	const categoriesKey = searchParams.categories.join(",");
	const originsKey = searchParams.origins.join(",");

	useEffect(() => {
		let isCurrent = true;
		const fetchBars = async () => {
			setIsBarsLoading(true);
			const result = await getBars({
				q: searchParams.q,
				city: searchParams.city,
				categories: categoriesKey ? categoriesKey.split(",") : [],
				origins: originsKey ? originsKey.split(",") : [],
			});
			if (!isCurrent) return;
			setBars(result);
			setIsBarsLoading(false);
		};

		fetchBars();
		return () => {
			isCurrent = false;
		};
	}, [searchParams.q, searchParams.city, categoriesKey, originsKey]);

	const handleSearch = (params: {
		q: string;
		city: string;
		categories: string[];
		origins: string[];
	}) => {
		setSearchParams(params);

		const queryString = buildSearchQueryString(params);
		router.replace(queryString ? `/?${queryString}` : "/", {
			scroll: false,
		});
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
				{/* ヒーロー + 検索（PC はヒーロー左・検索カード右の2カラム） */}
				<section className="mb-8 grid gap-6 md:mb-10 md:grid-cols-[1fr_minmax(360px,420px)] md:items-start md:gap-10">
					<div>
						<p className="mb-3 font-archivo text-xs uppercase tracking-[0.24em] text-primary">
							Tonight&apos;s Craft Beer
						</p>
						<h1 className="font-mincho text-[26px] font-black leading-[1.3] text-heading md:text-[40px]">
							今夜の一杯を、
							<br />
							この街で見つける。
						</h1>
						<p className="mt-4 max-w-md text-sm leading-relaxed text-subtext md:text-[15px]">
							キーワード・市町村・ビールカテゴリ・産地から、あなたにぴったりのクラフトビアバーを探せます。
						</p>
					</div>

					{/* Why not: 制御 input の value を毎レンダリング上書きすると入力中のIME変換が
					    途切れるため、URL のパラメータが変わったときだけ key で再マウントして初期値を反映する。 */}
					<SearchForm
						key={`${urlQuery}|${urlCity}|${urlCat}|${urlOrigin}`}
						initialValues={searchParams}
						onSearch={handleSearch}
					/>
				</section>

				{/* 地図 + 店舗一覧（PC は左マップ固定・右2列グリッドの2カラム） */}
				<section className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-8">
					<div className="md:sticky md:top-20 md:h-[calc(100vh-8rem)]">
						<GoogleMap city={searchParams.city} bars={bars} />
					</div>
					<BarList bars={bars} isLoading={isBarsLoading} />
				</section>

				{/* 人気カテゴリ横スクロール */}
				<PopularCategoriesScroll />
			</div>
		</div>
	);
}
