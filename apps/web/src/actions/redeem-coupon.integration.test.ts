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

import { redeemCoupon } from "@/actions/coupon";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let bob: TestAuthUser;
let barId: bigint;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	bob = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma, { name: "it-use-coupon-bar" });
	barId = bar.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId, bob.authUserId],
	});
	await prisma.$disconnect();
});

// 取得済み user_coupon を1件用意するヘルパー。
async function obtainFor(
	userProfileId: string,
	couponId: bigint,
): Promise<bigint> {
	const uc = await prisma.userCoupon.create({
		data: { userId: userProfileId, couponId, isUsed: false },
	});
	return uc.id;
}

describe("redeemCoupon (Integration)", () => {
	it("取得済みクーポンを利用すると is_used=true / used_at 記録 / used_count が +1 される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
			usedCount: 0,
		});
		const userCouponId = await obtainFor(alice.userProfileId, coupon.id);

		const result = await redeemCoupon(userCouponId.toString());

		expect(result).toEqual({ ok: true });

		const uc = await prisma.userCoupon.findUnique({
			where: { id: userCouponId },
		});
		expect(uc?.isUsed).toBe(true);
		expect(uc?.usedAt).not.toBeNull();

		const updatedCoupon = await prisma.barCoupon.findUnique({
			where: { id: coupon.id },
		});
		expect(updatedCoupon?.usedCount).toBe(1);
	});

	it("既に利用済みのクーポンは二重利用できず、used_count もインクリメントされない", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
			usedCount: 0,
		});
		const userCouponId = await obtainFor(alice.userProfileId, coupon.id);

		const first = await redeemCoupon(userCouponId.toString());
		expect(first).toEqual({ ok: true });

		const second = await redeemCoupon(userCouponId.toString());
		expect(second).toEqual({ ok: false, reason: "already_used" });

		const updatedCoupon = await prisma.barCoupon.findUnique({
			where: { id: coupon.id },
		});
		expect(updatedCoupon?.usedCount).toBe(1);
	});

	it("同一 user_coupon への並行利用でも二重にならず、used_count は1しか増えない", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
			usedCount: 0,
		});
		const userCouponId = await obtainFor(alice.userProfileId, coupon.id);

		const [a, b] = await Promise.all([
			redeemCoupon(userCouponId.toString()),
			redeemCoupon(userCouponId.toString()),
		]);

		const results = [a, b];
		const successCount = results.filter((r) => r.ok).length;
		const alreadyUsedCount = results.filter(
			(r) => !r.ok && r.reason === "already_used",
		).length;

		expect(successCount).toBe(1);
		expect(alreadyUsedCount).toBe(1);

		const updatedCoupon = await prisma.barCoupon.findUnique({
			where: { id: coupon.id },
		});
		expect(updatedCoupon?.usedCount).toBe(1);
	});

	it("利用上限に達したクーポン（used_count >= usage_limit）は利用できない", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			usageLimit: 3,
			usedCount: 3,
		});
		const userCouponId = await obtainFor(alice.userProfileId, coupon.id);

		const result = await redeemCoupon(userCouponId.toString());

		expect(result).toEqual({ ok: false, reason: "limit_reached" });

		const uc = await prisma.userCoupon.findUnique({
			where: { id: userCouponId },
		});
		expect(uc?.isUsed).toBe(false);
	});

	it("有効期限外（validUntil が過去）のクーポンは利用できない", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2000-01-01T00:00:00.000Z"),
		});
		const userCouponId = await obtainFor(alice.userProfileId, coupon.id);

		const result = await redeemCoupon(userCouponId.toString());

		expect(result).toEqual({ ok: false, reason: "expired" });
	});

	it("他人が取得したクーポンは利用できない（not_found）", async () => {
		// alice のクーポンを bob が利用しようとする。
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
			usedCount: 0,
		});
		const userCouponId = await obtainFor(alice.userProfileId, coupon.id);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: bob.authUserId } },
		});

		const result = await redeemCoupon(userCouponId.toString());

		expect(result).toEqual({ ok: false, reason: "not_found" });

		const uc = await prisma.userCoupon.findUnique({
			where: { id: userCouponId },
		});
		expect(uc?.isUsed).toBe(false);
	});
});
