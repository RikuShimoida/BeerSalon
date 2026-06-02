import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import CouponDetail from "./CouponDetail";

export default async function CouponDetailPage({
	params,
}: {
	params: Promise<{ barId: string; couponId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId, couponId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<CouponDetail barId={barId} couponId={couponId} userRole={user.role} />
		</DashboardLayout>
	);
}
