import { redirect } from "next/navigation";
import CouponForm from "@/components/CouponForm";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";

export default async function EditCouponPage({
	params,
}: {
	params: Promise<{ barId: string; couponId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId, couponId } = await params;

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">クーポン編集</h1>
					<p className="mt-1 text-sm text-gray-600">クーポン情報を編集します</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<CouponForm barId={barId} couponId={couponId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
