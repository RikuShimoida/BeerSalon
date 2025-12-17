import { redirect } from "next/navigation";
import { getUserCoupons } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function CouponsPage() {
	const coupons = await getUserCoupons();

	if (coupons === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-2xl font-bold text-gray-900">
							取得済みクーポン
						</h1>
					</div>

					{coupons.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500">取得済みのクーポンはありません</p>
						</div>
					) : (
						<div className="divide-y divide-gray-200">
							{coupons.map((coupon) => (
								<div
									key={coupon.id}
									className="p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex flex-col gap-2">
										<div className="flex items-start justify-between">
											<h2 className="text-lg font-semibold text-gray-900">
												{coupon.title}
											</h2>
											{coupon.isUsed && (
												<span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
													使用済み
												</span>
											)}
										</div>

										<p className="text-gray-700">{coupon.description}</p>

										{coupon.conditions && (
											<div className="text-sm text-gray-600">
												<span className="font-medium">取得条件：</span>
												{coupon.conditions}
											</div>
										)}

										<div className="text-sm text-gray-600">
											<span className="font-medium">対象店舗：</span>
											{coupon.barName}
										</div>

										{coupon.validUntil && (
											<div className="text-sm text-gray-600">
												<span className="font-medium">有効期限：</span>
												{new Date(coupon.validUntil).toLocaleDateString(
													"ja-JP",
												)}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
