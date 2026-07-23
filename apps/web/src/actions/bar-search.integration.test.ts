import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestBar,
	INTEGRATION_TEST_PREFIX,
} from "@/test/integration-helpers";

vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
		},
	}),
}));

import { getBars } from "@/actions/bar";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

// 検証用に固有名を使う (既存 seed の bar と混在しても it- prefix で安全に絞り込める)
const uniqueCity = `it-city-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueCategoryName = `it-cat-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueCategoryName2 = `it-cat2-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueCountryName = `it-country-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueRegionName = `it-region-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueCountryName2 = `it-country2-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueRegionName2 = `it-region2-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueKeyword = `it-kw-${faker.string.alphanumeric(6).toLowerCase()}`;

const geoCity = `it-geocity-${faker.string.alphanumeric(6).toLowerCase()}`;

let barOnlyCityId: bigint;
let barOnlyCategoryId: bigint;
let barOnlyCategory2Id: bigint;
let barOnlyOriginId: bigint;
let barOnlyOrigin2Id: bigint;
let barCat1Region2Id: bigint;
let barAllMatchedId: bigint;
let barKeywordInNameId: bigint;
let barWithGeoId: bigint;
let barWithoutGeoId: bigint;
let createdCategoryId: bigint;
let createdCategory2Id: bigint;
let createdCountryId: bigint;
let createdRegionId: bigint;
let createdCountry2Id: bigint;
let createdRegion2Id: bigint;
let createdBreweryId: bigint;

beforeAll(async () => {
	// Why not: 既存 seed のマスタを汚さないよう、すべて it- prefix で新規作成して
	// テスト用 bar のみが該当するよう仕込む。cleanup では bars と user系のみが消えるため、
	// このテスト固有のマスタ (beer / beer_category / region / country / brewery) は
	// afterAll で明示的に削除する。
	const cat = await prisma.beerCategory.create({
		data: { name: uniqueCategoryName },
	});
	createdCategoryId = cat.id;

	const cat2 = await prisma.beerCategory.create({
		data: { name: uniqueCategoryName2 },
	});
	createdCategory2Id = cat2.id;

	const country = await prisma.country.create({
		data: { name: uniqueCountryName },
	});
	createdCountryId = country.id;

	const region = await prisma.region.create({
		data: { name: uniqueRegionName, countryId: country.id },
	});
	createdRegionId = region.id;

	const country2 = await prisma.country.create({
		data: { name: uniqueCountryName2 },
	});
	createdCountry2Id = country2.id;

	const region2 = await prisma.region.create({
		data: { name: uniqueRegionName2, countryId: country2.id },
	});
	createdRegion2Id = region2.id;

	const brewery = await prisma.brewery.create({
		data: {
			name: `it-brewery-${faker.string.alphanumeric(6).toLowerCase()}`,
			countryId: country.id,
			regionId: region.id,
		},
	});
	createdBreweryId = brewery.id;

	// 1) city のみ一致: city=uniqueCity, ビールなし
	const barOnlyCity = await createTestBar(prisma, { city: uniqueCity });
	barOnlyCityId = barOnlyCity.id;

	// 2) category のみ一致: ビールメニュー (category=uniqueCategoryName), city は異なる
	const barOnlyCategory = await createTestBar(prisma);
	barOnlyCategoryId = barOnlyCategory.id;
	const beer1 = await prisma.beer.create({
		data: {
			name: `it-beer-cat-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: cat.id,
			breweryId: brewery.id,
			// region は category 単独テスト時に origin と被らないよう null にしておく
			regionId: null,
		},
	});
	await prisma.barBeerMenu.create({
		data: { barId: barOnlyCategoryId, beerId: beer1.id },
	});

	// 3) origin のみ一致: ビールメニュー (region=uniqueRegionName, country=uniqueCountryName)
	const barOnlyOrigin = await createTestBar(prisma);
	barOnlyOriginId = barOnlyOrigin.id;
	const beer2 = await prisma.beer.create({
		data: {
			name: `it-beer-origin-${faker.string.alphanumeric(6).toLowerCase()}`,
			// category は別カテゴリを使いたいので seed のものを 1 つ持ってくる
			beerCategoryId: (
				await prisma.beerCategory.findFirstOrThrow({
					where: { name: { not: uniqueCategoryName } },
				})
			).id,
			breweryId: brewery.id,
			regionId: region.id,
		},
	});
	await prisma.barBeerMenu.create({
		data: { barId: barOnlyOriginId, beerId: beer2.id },
	});

	// 3-2) category2 のみ一致: ビールメニュー (category=uniqueCategoryName2), city は異なる
	const barOnlyCategory2 = await createTestBar(prisma);
	barOnlyCategory2Id = barOnlyCategory2.id;
	const beerCat2 = await prisma.beer.create({
		data: {
			name: `it-beer-cat2-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: cat2.id,
			breweryId: brewery.id,
			regionId: null,
		},
	});
	await prisma.barBeerMenu.create({
		data: { barId: barOnlyCategory2Id, beerId: beerCat2.id },
	});

	// 4) city + category + origin すべて一致
	const barAllMatched = await createTestBar(prisma, { city: uniqueCity });
	barAllMatchedId = barAllMatched.id;
	const beer3 = await prisma.beer.create({
		data: {
			name: `it-beer-all-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: cat.id,
			breweryId: brewery.id,
			regionId: region.id,
		},
	});
	await prisma.barBeerMenu.create({
		data: { barId: barAllMatched.id, beerId: beer3.id },
	});

	// 4-2) origin2 のみ一致: region2 の産地ビール (産地 OR 検証用)
	const barOnlyOrigin2 = await createTestBar(prisma);
	barOnlyOrigin2Id = barOnlyOrigin2.id;
	const beerOrigin2 = await prisma.beer.create({
		data: {
			name: `it-beer-origin2-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: (
				await prisma.beerCategory.findFirstOrThrow({
					where: { name: { notIn: [uniqueCategoryName, uniqueCategoryName2] } },
				})
			).id,
			breweryId: brewery.id,
			regionId: region2.id,
		},
	});
	await prisma.barBeerMenu.create({
		data: { barId: barOnlyOrigin2Id, beerId: beerOrigin2.id },
	});

	// 4-3) category=cat1 と origin=region2 を「別々のビール」で満たす bar。
	// カテゴリと産地を独立した AND (店舗単位) で判定するため、同一メニュー縛りでは
	// ヒットしないが、店舗単位の AND ではヒットすることを検証する (Issue #491)。
	const barCat1Region2 = await createTestBar(prisma);
	barCat1Region2Id = barCat1Region2.id;
	const beerCat1NoRegion = await prisma.beer.create({
		data: {
			name: `it-beer-c1r2a-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: cat.id,
			breweryId: brewery.id,
			regionId: null,
		},
	});
	const beerRegion2OtherCat = await prisma.beer.create({
		data: {
			name: `it-beer-c1r2b-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: (
				await prisma.beerCategory.findFirstOrThrow({
					where: { name: { notIn: [uniqueCategoryName, uniqueCategoryName2] } },
				})
			).id,
			breweryId: brewery.id,
			regionId: region2.id,
		},
	});
	await prisma.barBeerMenu.create({
		data: { barId: barCat1Region2Id, beerId: beerCat1NoRegion.id },
	});
	await prisma.barBeerMenu.create({
		data: { barId: barCat1Region2Id, beerId: beerRegion2OtherCat.id },
	});

	// 5) フリーワード一致: 店名に uniqueKeyword を含む bar (city / category / origin はデフォルト)
	const barKeywordInName = await createTestBar(prisma, {
		name: `${INTEGRATION_TEST_PREFIX}bar-${uniqueKeyword}`,
	});
	barKeywordInNameId = barKeywordInName.id;

	// 6) 緯度経度あり / なしの bar: マップピン描画用に getBars が座標を返すか検証する
	const barWithGeo = await createTestBar(prisma, {
		city: geoCity,
		latitude: 35.1614,
		longitude: 138.6764,
	});
	barWithGeoId = barWithGeo.id;

	const barWithoutGeo = await createTestBar(prisma, {
		city: geoCity,
		latitude: null,
		longitude: null,
	});
	barWithoutGeoId = barWithoutGeo.id;
});

afterAll(async () => {
	// bars 系のクリーンアップは cleanupTestData が CASCADE 経由でやってくれる。
	await cleanupTestData(prisma, {});

	// このテストで作成したマスタを掃除する。
	await prisma.beer.deleteMany({
		where: { name: { startsWith: INTEGRATION_TEST_PREFIX } },
	});
	await prisma.brewery.deleteMany({ where: { id: createdBreweryId } });
	await prisma.region.deleteMany({
		where: { id: { in: [createdRegionId, createdRegion2Id] } },
	});
	await prisma.country.deleteMany({
		where: { id: { in: [createdCountryId, createdCountry2Id] } },
	});
	await prisma.beerCategory.deleteMany({
		where: { id: { in: [createdCategoryId, createdCategory2Id] } },
	});

	await prisma.$disconnect();
});

describe("getBars (Integration)", () => {
	it("city 単独フィルタは指定市町村の bar のみ返す", async () => {
		const result = await getBars({ city: uniqueCity });
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyCityId.toString(),
				barAllMatchedId.toString(),
			]),
		);
		expect(ids).not.toContain(barOnlyCategoryId.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});

	it("categories 単一指定はそのカテゴリのビールを提供する bar のみ返す", async () => {
		const result = await getBars({ categories: [uniqueCategoryName] });
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyCategoryId.toString(),
				barAllMatchedId.toString(),
			]),
		);
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategory2Id.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});

	it("categories 複数指定はいずれかのカテゴリを提供する bar をすべて返す (OR)", async () => {
		const result = await getBars({
			categories: [uniqueCategoryName, uniqueCategoryName2],
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyCategoryId.toString(),
				barOnlyCategory2Id.toString(),
				barAllMatchedId.toString(),
			]),
		);
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});

	it("categories 空配列はカテゴリで絞り込まず city 一致 bar も含めて返す", async () => {
		const result = await getBars({ categories: [] });
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyCityId.toString(),
				barOnlyCategoryId.toString(),
				barOnlyCategory2Id.toString(),
				barOnlyOriginId.toString(),
				barAllMatchedId.toString(),
			]),
		);
	});

	it("city + categories 複数指定は city と (いずれかのカテゴリ) の AND を満たす bar のみ返す", async () => {
		const result = await getBars({
			city: uniqueCity,
			categories: [uniqueCategoryName, uniqueCategoryName2],
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toContain(barAllMatchedId.toString());
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategoryId.toString());
		expect(ids).not.toContain(barOnlyCategory2Id.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});

	it("origins 単一指定は指定産地のビールを提供する bar のみ返す", async () => {
		const result = await getBars({
			origins: [`${uniqueCountryName}/${uniqueRegionName}`],
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyOriginId.toString(),
				barAllMatchedId.toString(),
			]),
		);
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategoryId.toString());
		expect(ids).not.toContain(barOnlyOrigin2Id.toString());
	});

	it("origins 複数指定はいずれかの産地のビールを提供する bar をすべて返す (OR)", async () => {
		const result = await getBars({
			origins: [
				`${uniqueCountryName}/${uniqueRegionName}`,
				`${uniqueCountryName2}/${uniqueRegionName2}`,
			],
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyOriginId.toString(),
				barOnlyOrigin2Id.toString(),
				barAllMatchedId.toString(),
			]),
		);
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategoryId.toString());
	});

	it("categories と origins を両方指定すると、別々のビールで両条件を満たす bar もヒットする (店舗単位 AND)", async () => {
		// barCat1Region2 は cat1 のビールと region2 のビールを別メニューで持つ。
		// 同一メニュー縛りでは落ちるが、店舗単位の独立 AND ではヒットする。
		const result = await getBars({
			categories: [uniqueCategoryName],
			origins: [`${uniqueCountryName2}/${uniqueRegionName2}`],
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toContain(barCat1Region2Id.toString());
		// cat1 は持つが region2 を持たない bar は落ちる
		expect(ids).not.toContain(barOnlyCategoryId.toString());
		// region2 は持つが cat1 を持たない bar は落ちる
		expect(ids).not.toContain(barOnlyOrigin2Id.toString());
	});

	it("city + category + origin の AND 複合フィルタは 3 条件すべてを満たす bar のみ返す", async () => {
		const result = await getBars({
			city: uniqueCity,
			categories: [uniqueCategoryName],
			origins: [`${uniqueCountryName}/${uniqueRegionName}`],
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toContain(barAllMatchedId.toString());
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategoryId.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});

	it("q フリーワードは店名に一致する bar を返す", async () => {
		const result = await getBars({ q: uniqueKeyword });
		const ids = result.map((bar) => bar.id);
		expect(ids).toContain(barKeywordInNameId.toString());
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategoryId.toString());
	});

	it("q フリーワードは大文字小文字を区別しない (insensitive)", async () => {
		const result = await getBars({ q: uniqueKeyword.toUpperCase() });
		const ids = result.map((bar) => bar.id);
		expect(ids).toContain(barKeywordInNameId.toString());
	});

	it("q + city は両方を満たす bar のみ返す (AND 結合)", async () => {
		// barKeywordInName は city がデフォルト (uniqueCity ではない) のため、
		// uniqueCity との AND では除外される。
		const result = await getBars({ q: uniqueKeyword, city: uniqueCity });
		const ids = result.map((bar) => bar.id);
		expect(ids).not.toContain(barKeywordInNameId.toString());
	});

	it("どの bar にも一致しない q は空配列を返す", async () => {
		const result = await getBars({
			q: `it-nomatch-${faker.string.alphanumeric(10).toLowerCase()}`,
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).not.toContain(barKeywordInNameId.toString());
		expect(ids).not.toContain(barOnlyCityId.toString());
	});

	it("緯度経度が登録された bar は latitude/longitude を文字列で返す (マップピン用)", async () => {
		const result = await getBars({ city: geoCity });
		const withGeo = result.find((bar) => bar.id === barWithGeoId.toString());
		expect(withGeo).toBeDefined();
		expect(Number(withGeo?.latitude)).toBeCloseTo(35.1614, 4);
		expect(Number(withGeo?.longitude)).toBeCloseTo(138.6764, 4);
	});

	it("緯度経度が未登録の bar は latitude/longitude が null だが一覧には含まれる", async () => {
		const result = await getBars({ city: geoCity });
		const withoutGeo = result.find(
			(bar) => bar.id === barWithoutGeoId.toString(),
		);
		expect(withoutGeo).toBeDefined();
		expect(withoutGeo?.latitude).toBeNull();
		expect(withoutGeo?.longitude).toBeNull();
	});
});
