import DashboardLayout from "@/components/DashboardLayout";
import { requireBarAccess } from "@/lib/auth";
import CouponList from "./CouponList";

export default async function CouponsPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const { barId } = await params;
	const user = await requireBarAccess(barId);

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<CouponList barId={barId} userRole={user.role} />
		</DashboardLayout>
	);
}
