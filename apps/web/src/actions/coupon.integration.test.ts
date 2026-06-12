import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestAuthUser,
	createTestBar,
	createTestCoupon,
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

import { getUserCoupons } from "@/actions/user";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let firstCouponId: bigint;
let secondCouponId: bigint;
const firstBarName = "it-coupon-bar-first";
const secondBarName = "it-coupon-bar-second";
const validUntilDate = new Date("2099-12-31T00:00:00.000Z");

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	const firstBar = await createTestBar(prisma, { name: firstBarName });
	const secondBar = await createTestBar(prisma, { name: secondBarName });

	const firstCoupon = await createTestCoupon(prisma, firstBar.id, {
		title: "it-coupon-title-first",
		description: "it-coupon-desc-first",
		validUntil: validUntilDate,
	});
	firstCouponId = firstCoupon.id;

	const secondCoupon = await createTestCoupon(prisma, secondBar.id, {
		title: "it-coupon-title-second",
		description: null,
		validUntil: null,
	});
	secondCouponId = secondCoupon.id;

	// Why not: getUserCoupons は obtainedAt の DESC ソートを assert する。
	// 1 つめを先に作って後から 2 つめを作れば 2 つめが先頭になるはずだが、
	// 同タイムスタンプでも差異が出るよう obtainedAt を明示的にずらして登録する。
	await prisma.userCoupon.create({
		data: {
			userId: alice.userProfileId,
			couponId: firstCouponId,
			obtainedAt: new Date("2026-01-01T00:00:00.000Z"),
			isUsed: false,
		},
	});
	await prisma.userCoupon.create({
		data: {
			userId: alice.userProfileId,
			couponId: secondCouponId,
			obtainedAt: new Date("2026-06-01T00:00:00.000Z"),
			isUsed: true,
		},
	});
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId],
	});
	await prisma.$disconnect();
});

describe("getUserCoupons (Integration)", () => {
	it("認証ユーザーの取得済みクーポンを obtainedAt DESC で返し、各フィールドを実 DB から正しく整形する", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		const result = await getUserCoupons();

		expect(result).not.toBeNull();
		expect(result).toHaveLength(2);

		// 1 件目: obtainedAt が新しい second 側
		const [latest, oldest] = result ?? [];
		expect(latest.title).toBe("it-coupon-title-second");
		expect(latest.description).toBe("");
		expect(latest.barName).toBe(secondBarName);
		expect(latest.validUntil).toBeNull();
		expect(latest.isUsed).toBe(true);
		expect(latest.obtainedAt.toISOString()).toBe("2026-06-01T00:00:00.000Z");

		// 2 件目: 古い first 側
		expect(oldest.title).toBe("it-coupon-title-first");
		expect(oldest.description).toBe("it-coupon-desc-first");
		expect(oldest.barName).toBe(firstBarName);
		expect(oldest.validUntil).not.toBeNull();
		expect(oldest.validUntil?.toISOString()).toBe(validUntilDate.toISOString());
		expect(oldest.isUsed).toBe(false);
		expect(oldest.obtainedAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
	});
});
