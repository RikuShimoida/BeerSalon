interface Coupon {
	id: string;
	title: string;
	description: string;
	conditions: string | null;
	validFrom: Date | null;
	validUntil: Date | null;
}

interface CouponsTabProps {
	coupons: Coupon[];
}

export function CouponsTab({ coupons }: CouponsTabProps) {
	if (coupons.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">クーポンはまだ発行されていません。</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{coupons.map((coupon) => (
				<div
					key={coupon.id}
					className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
				>
					<h3 className="font-bold text-lg text-gray-900 mb-2">
						{coupon.title}
					</h3>
					<p className="text-gray-700 mb-3">{coupon.description}</p>

					{coupon.conditions && (
						<div className="mb-3">
							<h4 className="text-sm font-semibold text-gray-700 mb-1">
								取得条件
							</h4>
							<p className="text-sm text-gray-600">{coupon.conditions}</p>
						</div>
					)}

					{(coupon.validFrom || coupon.validUntil) && (
						<div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
							{coupon.validFrom && (
								<p>
									開始: {new Date(coupon.validFrom).toLocaleDateString("ja-JP")}
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
				</div>
			))}
		</div>
	);
}
