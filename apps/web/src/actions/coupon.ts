"use server";

import { Prisma } from "@/generated/prisma";
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

	// 事前の存在チェックは UX 上のフィードバック（連打前に取得済みを返す）のために残す。
	// ただし最終的な二重取得防止は DB の UNIQUE 制約 (user_id, coupon_id) と、
	// 下の P2002 ハンドリングで担保する（並行リクエストで findFirst をすり抜けても
	// UNIQUE 違反で1件に収束させる）。
	const existing = await prisma.userCoupon.findFirst({
		where: {
			userId: userProfile.id,
			couponId: coupon.id,
		},
	});

	if (existing) {
		return { ok: false, reason: "already_obtained" };
	}

	try {
		await prisma.userCoupon.create({
			data: {
				userId: userProfile.id,
				couponId: coupon.id,
			},
		});
	} catch (error) {
		// Why not: TOCTOU（findFirst 通過 → 並行 INSERT）をアプリ側ロックで直列化するのではなく、
		// DB の UNIQUE 制約に委ねる。P2002（unique constraint violation）は「既に取得済み」として扱う。
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return { ok: false, reason: "already_obtained" };
		}
		throw error;
	}

	return { ok: true };
}

export type RedeemCouponResult =
	| { ok: true }
	| {
			ok: false;
			reason: "already_used" | "expired" | "limit_reached" | "not_found";
	  };

export async function redeemCoupon(
	userCouponId: string,
): Promise<RedeemCouponResult> {
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

	// Why not: 利用は「user_coupons の消し込み」と「bar_coupons.used_count のインクリメント」を
	// 同時に行う必要があり、取得ボタン連打などの並行リクエストで used_count が破綻しないよう
	// 対象行を FOR UPDATE でロックする。Prisma のインタラクティブトランザクションでも書けるが、
	// 営業時間・支払い方法の同期と同じく原子化は RPC に一本化する。
	const rows = await prisma.$queryRaw<Array<{ use_user_coupon: string }>>`
		SELECT use_user_coupon(${BigInt(userCouponId)}::bigint, ${userProfile.id}::uuid)
	`;

	const code = rows[0]?.use_user_coupon;

	switch (code) {
		case "ok":
			return { ok: true };
		case "already_used":
			return { ok: false, reason: "already_used" };
		case "expired":
			return { ok: false, reason: "expired" };
		case "limit_reached":
			return { ok: false, reason: "limit_reached" };
		default:
			return { ok: false, reason: "not_found" };
	}
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
