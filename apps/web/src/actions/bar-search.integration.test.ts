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
const uniqueCountryName = `it-country-${faker.string.alphanumeric(6).toLowerCase()}`;
const uniqueRegionName = `it-region-${faker.string.alphanumeric(6).toLowerCase()}`;

let barOnlyCityId: bigint;
let barOnlyCategoryId: bigint;
let barOnlyOriginId: bigint;
let barAllMatchedId: bigint;
let createdCategoryId: bigint;
let createdCountryId: bigint;
let createdRegionId: bigint;
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

	const country = await prisma.country.create({
		data: { name: uniqueCountryName },
	});
	createdCountryId = country.id;

	const region = await prisma.region.create({
		data: { name: uniqueRegionName, countryId: country.id },
	});
	createdRegionId = region.id;

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
});

afterAll(async () => {
	// bars 系のクリーンアップは cleanupTestData が CASCADE 経由でやってくれる。
	await cleanupTestData(prisma, {});

	// このテストで作成したマスタを掃除する。
	await prisma.beer.deleteMany({
		where: { name: { startsWith: INTEGRATION_TEST_PREFIX } },
	});
	await prisma.brewery.deleteMany({ where: { id: createdBreweryId } });
	await prisma.region.deleteMany({ where: { id: createdRegionId } });
	await prisma.country.deleteMany({ where: { id: createdCountryId } });
	await prisma.beerCategory.deleteMany({ where: { id: createdCategoryId } });

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

	it("category 単独フィルタはそのカテゴリのビールを提供する bar のみ返す", async () => {
		const result = await getBars({ category: uniqueCategoryName });
		const ids = result.map((bar) => bar.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				barOnlyCategoryId.toString(),
				barAllMatchedId.toString(),
			]),
		);
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});

	it("origin 単独フィルタは指定産地のビールを提供する bar のみ返す", async () => {
		const result = await getBars({
			origin: `${uniqueCountryName}/${uniqueRegionName}`,
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
	});

	it("city + category + origin の AND 複合フィルタは 3 条件すべてを満たす bar のみ返す", async () => {
		const result = await getBars({
			city: uniqueCity,
			category: uniqueCategoryName,
			origin: `${uniqueCountryName}/${uniqueRegionName}`,
		});
		const ids = result.map((bar) => bar.id);
		expect(ids).toContain(barAllMatchedId.toString());
		expect(ids).not.toContain(barOnlyCityId.toString());
		expect(ids).not.toContain(barOnlyCategoryId.toString());
		expect(ids).not.toContain(barOnlyOriginId.toString());
	});
});
