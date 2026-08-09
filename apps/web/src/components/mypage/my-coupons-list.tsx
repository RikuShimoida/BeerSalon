"use client";

import { formatDateJst } from "@beersalon/shared";
import { Ticket } from "lucide-react";
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
			<div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
				<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-primary/60">
					<Ticket className="h-7 w-7" />
				</div>
				<p className="font-medium text-heading">
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
		<div className="flex flex-col gap-4">
			{coupons.map((coupon) => {
				const isUsed = usedIds.has(coupon.id);
				const withinPeriod = isWithinValidPeriod(coupon);
				const limitReached = isLimitReached(coupon);
				const isUsable = !isUsed && withinPeriod && !limitReached;
				const isLoading = loadingId === coupon.id;

				return (
					<div
						key={coupon.id}
						className={`flex overflow-hidden rounded-2xl border border-border bg-card modern-shadow transition-opacity ${
							isUsed ? "opacity-60" : ""
						}`}
					>
						{/* Why not 通常のカードのままにしない: チケット型を表現するため、左端に
						    破線区切り + 縦書きラベルのスタブ列を独立させて視覚的に「もぎり」を表す。 */}
						<div
							className={`flex w-14 flex-shrink-0 items-center justify-center border-r border-dashed ${
								isUsed
									? "border-border bg-surface-raised"
									: "border-primary/40 bg-primary/10"
							}`}
						>
							<span
								className={`text-xs font-semibold uppercase tracking-widest [writing-mode:vertical-rl] ${
									isUsed ? "text-subtext" : "text-primary"
								}`}
							>
								Coupon
							</span>
						</div>

						<div className="min-w-0 flex-1 p-4">
							<div className="flex items-start justify-between gap-2">
								<h2 className="font-mincho text-lg font-bold text-heading">
									{coupon.title}
								</h2>
								{isUsed && (
									<span className="flex-shrink-0 rounded-full bg-surface-raised px-2 py-1 text-xs font-medium text-subtext">
										使用済み
									</span>
								)}
							</div>

							<p className="mt-1 text-sm text-foreground">
								{coupon.description}
							</p>

							<div className="mt-2 text-sm text-subtext">
								<span className="font-medium">対象店舗：</span>
								{coupon.barName}
							</div>

							{coupon.validUntil && (
								<div className="text-sm text-subtext">
									<span className="font-medium">有効期限：</span>
									{formatDateJst(coupon.validUntil)}
								</div>
							)}

							{!isUsed && (
								<button
									type="button"
									onClick={() => handleUse(coupon.id)}
									disabled={!isUsable || isLoading}
									className="mt-3 w-full rounded-full bg-gradient-to-r from-primary to-primary-strong px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{!withinPeriod
										? "有効期限外"
										: limitReached
											? "利用上限に達しています"
											: isLoading
												? "利用中..."
												: "クーポンを利用する"}
								</button>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
