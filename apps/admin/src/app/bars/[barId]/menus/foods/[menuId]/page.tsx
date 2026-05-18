import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import FoodMenuDetail from "./FoodMenuDetail";

export default async function FoodMenuDetailPage({
	params,
}: {
	params: Promise<{ barId: string; menuId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId, menuId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<FoodMenuDetail barId={barId} menuId={menuId} userRole={user.role} />
		</DashboardLayout>
	);
}
