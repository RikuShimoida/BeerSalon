import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestAuthUser,
	createTestBar,
	createTestCoupon,
	INTEGRATION_TEST_PREFIX,
	type TestAuthUser,
} from "@/test/integration-helpers";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: mockGetUser,
		},
	}),
}));

import { getBarDetail } from "@/actions/bar";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let testBarId: bigint;
let createdBreweryId: bigint;
let createdBeerId: bigint;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma);
	testBarId = bar.id;

	// barImages: 基本情報タブ
	await prisma.barImage.create({
		data: {
			barId: testBarId,
			imageType: "exterior",
			imageUrl: "https://example.test/it-exterior.jpg",
			sortOrder: 0,
		},
	});

	// openingHours: 基本情報タブ
	await prisma.barOpeningHour.create({
		data: {
			barId: testBarId,
			dayOfWeek: 0,
			openTime: new Date("1970-01-01T17:00:00Z"),
			closeTime: new Date("1970-01-01T23:00:00Z"),
			sortOrder: 0,
		},
	});

	// barPaymentMethods: 基本情報タブ (seed 済みの "現金" を 1 つ紐付ける)
	const cashMethod = await prisma.paymentMethod.findFirstOrThrow({
		where: { name: "現金" },
	});
	await prisma.barPaymentMethod.create({
		data: { barId: testBarId, paymentMethodId: cashMethod.id },
	});

	// メニュータブ: beerMenu と foodMenu
	const beerCategory = await prisma.beerCategory.findFirstOrThrow({
		where: { isActive: true },
	});
	const brewery = await prisma.brewery.create({
		data: {
			name: `${INTEGRATION_TEST_PREFIX}brewery-${faker.string.alphanumeric(6).toLowerCase()}`,
		},
	});
	createdBreweryId = brewery.id;
	const beer = await prisma.beer.create({
		data: {
			name: `${INTEGRATION_TEST_PREFIX}beer-${faker.string.alphanumeric(6).toLowerCase()}`,
			beerCategoryId: beerCategory.id,
			breweryId: brewery.id,
		},
	});
	createdBeerId = beer.id;
	const beerMenu = await prisma.barBeerMenu.create({
		data: { barId: testBarId, beerId: beer.id },
	});
	await prisma.barBeerMenuSize.create({
		data: {
			barBeerMenuId: beerMenu.id,
			sizeName: "パイント",
			price: 1000,
			sortOrder: 0,
		},
	});
	await prisma.barFoodMenu.create({
		data: {
			barId: testBarId,
			name: `${INTEGRATION_TEST_PREFIX}food-menu`,
			price: 800,
		},
	});

	// タグ付けされた投稿タブ: posts + postImages
	const post = await prisma.post.create({
		data: {
			userId: alice.userProfileId,
			barId: testBarId,
			body: "it-bar-detail-post",
		},
	});
	await prisma.postImage.create({
		data: {
			postId: post.id,
			imageUrl: "https://example.test/it-post-image.jpg",
			sortOrder: 0,
		},
	});

	// お店からの投稿タブ: articles (status='published', deletedAt=null のみ取得対象)
	await prisma.article.create({
		data: {
			barId: testBarId,
			title: "it-article-published",
			body: "it-article-body",
			status: "published",
			publishedAt: new Date("2026-01-01T00:00:00.000Z"),
		},
	});
	// draft は取得されないことを確認したいので 1 件作っておく
	await prisma.article.create({
		data: {
			barId: testBarId,
			title: "it-article-draft",
			body: "it-article-body-draft",
			status: "draft",
		},
	});

	// クーポンタブ
	await createTestCoupon(prisma, testBarId, { title: "it-coupon-detail" });

	// イベントタブ (未来日のイベントだけ取得される)
	await prisma.barEvent.create({
		data: {
			barId: testBarId,
			title: "it-event-future",
			description: "future event",
			startDate: new Date("2099-01-01T00:00:00.000Z"),
			endDate: new Date("2099-01-02T00:00:00.000Z"),
		},
	});
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId],
	});
	await prisma.beer.deleteMany({ where: { id: createdBeerId } });
	await prisma.brewery.deleteMany({ where: { id: createdBreweryId } });
	await prisma.$disconnect();
});

describe("getBarDetail (Integration)", () => {
	it("6タブ分のリレーション include を漏れなく取得できる", async () => {
		// Why not: 実装は currentUserId が null の場合 postLikes を include せず post.postLikes.length で
		// クラッシュする既知の挙動がある (テストでは実装変更しない方針)。
		// ここではログイン済みユーザーで getBarDetail を呼び、6 タブ分のリレーション include を網羅検証する。
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const bar = await getBarDetail(testBarId.toString());

		expect(bar).not.toBeNull();
		if (!bar) return;

		// 基本情報タブ: barImages / openingHours / paymentMethods
		expect(bar.barImages.length).toBeGreaterThanOrEqual(1);
		expect(bar.barImages[0].imageType).toBe("exterior");
		expect(bar.openingHours.length).toBeGreaterThanOrEqual(1);
		expect(bar.openingHours[0].dayOfWeek).toBe(0);
		expect(bar.paymentMethods.length).toBeGreaterThanOrEqual(1);
		expect(bar.paymentMethods[0].name).toBe("現金");

		// メニュータブ: beerMenus (with sizes/beer/brewery/category) + foodMenus
		expect(bar.beerMenus.length).toBeGreaterThanOrEqual(1);
		const menu = bar.beerMenus[0];
		expect(menu.beer).toBeDefined();
		expect(menu.beer.brewery).not.toBeNull();
		expect(menu.beer.beerCategory).toBeDefined();
		expect(menu.sizes.length).toBeGreaterThanOrEqual(1);
		expect(menu.sizes[0].sizeName).toBe("パイント");
		expect(bar.foodMenus.length).toBeGreaterThanOrEqual(1);

		// タグ付けされた投稿タブ: posts
		expect(bar.posts.length).toBeGreaterThanOrEqual(1);
		const detailPost = bar.posts.find((p) => p.body === "it-bar-detail-post");
		expect(detailPost).toBeDefined();
		expect(detailPost?.postImages.length).toBeGreaterThanOrEqual(1);

		// お店からの投稿タブ: articles (published のみ。draft は除外)
		expect(bar.articles.length).toBeGreaterThanOrEqual(1);
		const publishedTitles = bar.articles.map((a) => a.title);
		expect(publishedTitles).toContain("it-article-published");
		expect(publishedTitles).not.toContain("it-article-draft");

		// クーポンタブ
		expect(bar.coupons.length).toBeGreaterThanOrEqual(1);
		expect(bar.coupons.map((c) => c.title)).toContain("it-coupon-detail");

		// イベントタブ
		expect(bar.events.length).toBeGreaterThanOrEqual(1);
		expect(bar.events.map((e) => e.title)).toContain("it-event-future");
	});
});
