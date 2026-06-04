import { redirect } from "next/navigation";
import CouponForm from "@/components/CouponForm";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";

export default async function NewCouponPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "bar_owner") {
		redirect("/bars");
	}

	const { barId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">クーポン追加</h1>
					<p className="mt-1 text-sm text-gray-600">
						新しいクーポンを登録します
					</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<CouponForm barId={barId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
