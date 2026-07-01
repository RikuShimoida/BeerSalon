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

import { obtainCoupon } from "@/actions/coupon";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let barId: bigint;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma, { name: "it-obtain-coupon-bar" });
	barId = bar.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId],
	});
	await prisma.$disconnect();
});

describe("obtainCoupon (Integration)", () => {
	it("有効なクーポンを取得すると user_coupons にレコードが作成される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
		});

		const result = await obtainCoupon(coupon.id.toString());

		expect(result).toEqual({ ok: true });

		const rows = await prisma.userCoupon.findMany({
			where: { userId: alice.userProfileId, couponId: coupon.id },
		});
		expect(rows).toHaveLength(1);
		expect(rows[0].isUsed).toBe(false);
	});

	it("同じクーポンを二重取得できず、user_coupons は1件のままになる", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
		});

		const first = await obtainCoupon(coupon.id.toString());
		expect(first).toEqual({ ok: true });

		const second = await obtainCoupon(coupon.id.toString());
		expect(second).toEqual({ ok: false, reason: "already_obtained" });

		const rows = await prisma.userCoupon.findMany({
			where: { userId: alice.userProfileId, couponId: coupon.id },
		});
		expect(rows).toHaveLength(1);
	});

	it("同一クーポンへの並行取得でも二重にならず、成功1件・もう一方は取得済みになる", async () => {
		// mockResolvedValue（持続）で並行呼び出しの getUser を両方満たす。
		mockGetUser.mockResolvedValue({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2099-12-31T00:00:00.000Z"),
		});

		// Promise.all で同一ユーザー・同一クーポンへの取得を並行実行し、
		// TOCTOU（findFirst すり抜け → 並行 INSERT）でも UNIQUE 制約 + P2002 で
		// 1件に収束することを検証する。
		const [a, b] = await Promise.all([
			obtainCoupon(coupon.id.toString()),
			obtainCoupon(coupon.id.toString()),
		]);

		const results = [a, b];
		const successCount = results.filter((r) => r.ok).length;
		const alreadyObtainedCount = results.filter(
			(r) => !r.ok && r.reason === "already_obtained",
		).length;

		expect(successCount).toBe(1);
		expect(alreadyObtainedCount).toBe(1);

		const rows = await prisma.userCoupon.findMany({
			where: { userId: alice.userProfileId, couponId: coupon.id },
		});
		expect(rows).toHaveLength(1);
	});

	it("有効期限切れ（validUntil が過去）のクーポンは取得できない", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validUntil: new Date("2000-01-01T00:00:00.000Z"),
		});

		const result = await obtainCoupon(coupon.id.toString());

		expect(result).toEqual({ ok: false, reason: "expired" });
		const rows = await prisma.userCoupon.findMany({
			where: { userId: alice.userProfileId, couponId: coupon.id },
		});
		expect(rows).toHaveLength(0);
	});

	it("開始前（validFrom が未来）のクーポンは取得できない", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			validFrom: new Date("2099-01-01T00:00:00.000Z"),
		});

		const result = await obtainCoupon(coupon.id.toString());

		expect(result).toEqual({ ok: false, reason: "expired" });
	});

	it("利用上限に達したクーポン（usedCount >= usageLimit）は取得できない", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			usageLimit: 5,
			usedCount: 5,
		});

		const result = await obtainCoupon(coupon.id.toString());

		expect(result).toEqual({ ok: false, reason: "limit_reached" });
		const rows = await prisma.userCoupon.findMany({
			where: { userId: alice.userProfileId, couponId: coupon.id },
		});
		expect(rows).toHaveLength(0);
	});

	it("非公開（isActive=false）のクーポンは取得できない", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const coupon = await createTestCoupon(prisma, barId, {
			isActive: false,
		});

		const result = await obtainCoupon(coupon.id.toString());

		expect(result).toEqual({ ok: false, reason: "not_found" });
	});
});
