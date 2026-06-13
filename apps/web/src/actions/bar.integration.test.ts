import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestAuthUser,
	createTestBar,
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

import {
	addFavoriteBar,
	getBeerRegions,
	removeFavoriteBar,
} from "@/actions/bar";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let testBarId: bigint;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma);
	testBarId = bar.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId],
	});
	await prisma.$disconnect();
});

describe("addFavoriteBar / removeFavoriteBar (Integration)", () => {
	it("addFavoriteBar で favorite_bars に行が追加される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		await addFavoriteBar(testBarId.toString());

		const favorite = await prisma.favoriteBar.findUnique({
			where: {
				userId_barId: {
					userId: alice.userProfileId,
					barId: testBarId,
				},
			},
		});
		expect(favorite).not.toBeNull();
	});

	it("removeFavoriteBar で favorite_bars 行が削除される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		await removeFavoriteBar(testBarId.toString());

		const favorite = await prisma.favoriteBar.findUnique({
			where: {
				userId_barId: {
					userId: alice.userProfileId,
					barId: testBarId,
				},
			},
		});
		expect(favorite).toBeNull();
	});
});

describe("getBeerRegions (Integration)", () => {
	it("実 DB のレコードを { 国名: [地域名, ...] } 形式でグループ化して返す", async () => {
		// Why not: seed.e2e.sql に { 日本: [静岡, 東京], アメリカ, ベルギー } が投入されている前提。
		// 順序や追加された地域の影響を受けにくいよう「期待するキー/値の包含」を assert する。
		const grouped = await getBeerRegions();

		expect(grouped).toHaveProperty("日本");
		expect(Array.isArray(grouped.日本)).toBe(true);
		expect(grouped.日本).toEqual(expect.arrayContaining(["静岡", "東京"]));

		// 国名キーは ASC ソートされている (実装側で orderBy country.name asc + region name asc)。
		// 1 つ以上の地域を持つ国だけがキーになる。
		for (const regions of Object.values(grouped)) {
			expect(regions.length).toBeGreaterThan(0);
		}
	});
});
