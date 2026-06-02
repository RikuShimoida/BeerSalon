import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import FoodMenuForm from "@/components/FoodMenuForm";
import { canAccessBar, getCurrentUser } from "@/lib/auth";

export default async function EditFoodMenuPage({
	params,
}: {
	params: Promise<{ barId: string; menuId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "bar_owner") {
		redirect("/bars");
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
			<div className="space-y-6 max-w-2xl">
				<h1 className="text-2xl font-bold text-gray-900">食事メニュー編集</h1>
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<FoodMenuForm barId={barId} menuId={menuId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
