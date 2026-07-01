"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type ObtainCouponResult =
	| { ok: true }
	| {
			ok: false;
			reason: "already_obtained" | "expired" | "limit_reached" | "not_found";
	  };

export async function obtainCoupon(
	couponId: string,
): Promise<ObtainCouponResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("Not authenticated");
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		throw new Error("User profile not found");
	}

	const coupon = await prisma.barCoupon.findUnique({
		where: {
			id: BigInt(couponId),
		},
	});

	if (!coupon || !coupon.isActive) {
		return { ok: false, reason: "not_found" };
	}

	const now = new Date();
	if (coupon.validFrom && coupon.validFrom > now) {
		return { ok: false, reason: "expired" };
	}
	if (coupon.validUntil && coupon.validUntil < now) {
		return { ok: false, reason: "expired" };
	}

	// Why not: usageLimit を「取得回数の上限」として扱わない。database.md 3-2 の usedCount は
	// 「利用回数」であり、利用（消し込み）フローは Issue #346 のスコープ外。よって受入条件④の
	// 「利用上限到達のクーポンは取得できない」は usedCount >= usageLimit で判定するに留め、
	// 取得数そのものの上限管理は本 Issue では行わない。
	if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
		return { ok: false, reason: "limit_reached" };
	}

	// Why not: user_coupons に (user_id, coupon_id) の UNIQUE 制約が無い（database.md 3-2）ため
	// DB レベルで二重取得を弾けない。存在チェックと INSERT をトランザクションで囲い、
	// 直列化された同一トランザクション内で重複を防ぐ。
	return prisma.$transaction(async (tx) => {
		const existing = await tx.userCoupon.findFirst({
			where: {
				userId: userProfile.id,
				couponId: coupon.id,
			},
		});

		if (existing) {
			return { ok: false, reason: "already_obtained" };
		}

		await tx.userCoupon.create({
			data: {
				userId: userProfile.id,
				couponId: coupon.id,
			},
		});

		return { ok: true };
	});
}

export async function hasObtainedCoupon(couponId: string): Promise<boolean> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return false;
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		return false;
	}

	const existing = await prisma.userCoupon.findFirst({
		where: {
			userId: userProfile.id,
			couponId: BigInt(couponId),
		},
	});

	return existing !== null;
}
