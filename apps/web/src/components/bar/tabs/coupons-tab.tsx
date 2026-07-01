"use client";

import { useState } from "react";
import { toast } from "sonner";
import { obtainCoupon } from "@/actions/coupon";

interface Coupon {
	id: string;
	title: string;
	description: string | null;
	usageLimit: number | null;
	usedCount: number;
	validFrom: Date | null;
	validUntil: Date | null;
	isObtained: boolean;
}

interface CouponsTabProps {
	coupons: Coupon[];
}

function isWithinValidPeriod(coupon: Coupon): boolean {
	const now = new Date();
	if (coupon.validFrom && new Date(coupon.validFrom) > now) {
		return false;
	}
	if (coupon.validUntil && new Date(coupon.validUntil) < now) {
		return false;
	}
	return true;
}

function isLimitReached(coupon: Coupon): boolean {
	// Why not: usageLimit を「取得上限」ではなく「利用上限」として扱う（database.md 3-2）。
	// 取得ボタンの活性判定でも usedCount >= usageLimit を「取得不可」とみなす。
	return coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
}

export function CouponsTab({ coupons }: CouponsTabProps) {
	const [obtainedIds, setObtainedIds] = useState<Set<string>>(
		() => new Set(coupons.filter((c) => c.isObtained).map((c) => c.id)),
	);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	if (coupons.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">クーポンはまだ発行されていません。</p>
			</div>
		);
	}

	const handleObtain = async (couponId: string) => {
		if (loadingId) return;

		setLoadingId(couponId);
		try {
			const result = await obtainCoupon(couponId);

			if (result.ok) {
				setObtainedIds((prev) => new Set(prev).add(couponId));
				toast.success("クーポンを取得しました");
				return;
			}

			switch (result.reason) {
				case "already_obtained":
					setObtainedIds((prev) => new Set(prev).add(couponId));
					toast.error("このクーポンは取得済みです");
					break;
				case "expired":
					toast.error("このクーポンは有効期限外です");
					break;
				case "limit_reached":
					toast.error("このクーポンは利用上限に達しています");
					break;
				default:
					toast.error("このクーポンは取得できません");
			}
		} catch (error) {
			console.error("Failed to obtain coupon:", error);
			toast.error("クーポンの取得に失敗しました");
		} finally {
			setLoadingId(null);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{coupons.map((coupon) => {
				const isObtained = obtainedIds.has(coupon.id);
				const withinPeriod = isWithinValidPeriod(coupon);
				const limitReached = isLimitReached(coupon);
				const isObtainable = !isObtained && withinPeriod && !limitReached;
				const isLoading = loadingId === coupon.id;

				return (
					<div
						key={coupon.id}
						className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
					>
						<h3 className="font-bold text-lg text-gray-900 mb-2">
							{coupon.title}
						</h3>
						{coupon.description && (
							<p className="text-gray-700 mb-3">{coupon.description}</p>
						)}

						{(coupon.validFrom || coupon.validUntil) && (
							<div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
								{coupon.validFrom && (
									<p>
										開始:{" "}
										{new Date(coupon.validFrom).toLocaleDateString("ja-JP")}
									</p>
								)}
								{coupon.validUntil && (
									<p>
										終了:{" "}
										{new Date(coupon.validUntil).toLocaleDateString("ja-JP")}
									</p>
								)}
							</div>
						)}

						<div className="mt-4 pt-2">
							{isObtained ? (
								<p className="text-center text-sm font-medium text-green-600 py-2">
									取得済み
								</p>
							) : (
								<button
									type="button"
									onClick={() => handleObtain(coupon.id)}
									disabled={!isObtainable || isLoading}
									className="w-full py-2 px-4 rounded-md bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{!withinPeriod
										? "有効期限外"
										: limitReached
											? "利用上限に達しています"
											: isLoading
												? "取得中..."
												: "クーポンを取得する"}
								</button>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
