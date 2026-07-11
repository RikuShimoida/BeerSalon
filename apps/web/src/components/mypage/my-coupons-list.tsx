"use client";

import { useState } from "react";
import { toast } from "sonner";
import { redeemCoupon } from "@/actions/coupon";

interface MyCoupon {
	id: string;
	title: string;
	description: string;
	barName: string;
	validFrom: Date | null;
	validUntil: Date | null;
	usageLimit: number | null;
	usedCount: number;
	isUsed: boolean;
}

interface MyCouponsListProps {
	coupons: MyCoupon[];
}

function isWithinValidPeriod(coupon: MyCoupon): boolean {
	const now = new Date();
	if (coupon.validFrom && new Date(coupon.validFrom) > now) {
		return false;
	}
	if (coupon.validUntil && new Date(coupon.validUntil) < now) {
		return false;
	}
	return true;
}

function isLimitReached(coupon: MyCoupon): boolean {
	return coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
}

export function MyCouponsList({ coupons }: MyCouponsListProps) {
	const [usedIds, setUsedIds] = useState<Set<string>>(
		() => new Set(coupons.filter((c) => c.isUsed).map((c) => c.id)),
	);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	if (coupons.length === 0) {
		return (
			<div className="p-8 text-center">
				<p className="text-muted-foreground tracking-wide">
					取得済みのクーポンはありません
				</p>
			</div>
		);
	}

	const handleUse = async (userCouponId: string) => {
		if (loadingId) return;

		setLoadingId(userCouponId);
		try {
			const result = await redeemCoupon(userCouponId);

			if (result.ok) {
				setUsedIds((prev) => new Set(prev).add(userCouponId));
				toast.success("クーポンを利用しました");
				return;
			}

			switch (result.reason) {
				case "already_used":
					setUsedIds((prev) => new Set(prev).add(userCouponId));
					toast.error("このクーポンは利用済みです");
					break;
				case "expired":
					toast.error("このクーポンは有効期限外です");
					break;
				case "limit_reached":
					toast.error("このクーポンは利用上限に達しています");
					break;
				default:
					toast.error("このクーポンは利用できません");
			}
		} catch (error) {
			console.error("Failed to use coupon:", error);
			toast.error("クーポンの利用に失敗しました");
		} finally {
			setLoadingId(null);
		}
	};

	return (
		<div className="divide-y divide-border/50">
			{coupons.map((coupon) => {
				const isUsed = usedIds.has(coupon.id);
				const withinPeriod = isWithinValidPeriod(coupon);
				const limitReached = isLimitReached(coupon);
				const isUsable = !isUsed && withinPeriod && !limitReached;
				const isLoading = loadingId === coupon.id;

				return (
					<div
						key={coupon.id}
						className="p-4 hover:bg-primary/10 transition-all duration-300"
					>
						<div className="flex flex-col gap-2">
							<div className="flex items-start justify-between">
								<h2 className="text-lg font-semibold text-card-foreground tracking-tight">
									{coupon.title}
								</h2>
								{isUsed && (
									<span className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-lg">
										使用済み
									</span>
								)}
							</div>

							<p className="text-card-foreground tracking-wide">
								{coupon.description}
							</p>

							<div className="text-sm text-muted-foreground tracking-wide">
								<span className="font-medium">対象店舗：</span>
								{coupon.barName}
							</div>

							{coupon.validUntil && (
								<div className="text-sm text-muted-foreground tracking-wide">
									<span className="font-medium">有効期限：</span>
									{new Date(coupon.validUntil).toLocaleDateString("ja-JP")}
								</div>
							)}

							{!isUsed && (
								<div className="mt-2">
									<button
										type="button"
										onClick={() => handleUse(coupon.id)}
										disabled={!isUsable || isLoading}
										className="w-full py-2 px-4 rounded-md bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{!withinPeriod
											? "有効期限外"
											: limitReached
												? "利用上限に達しています"
												: isLoading
													? "利用中..."
													: "クーポンを利用する"}
									</button>
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
