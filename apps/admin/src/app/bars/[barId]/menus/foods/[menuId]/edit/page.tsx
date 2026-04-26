import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import FoodMenuForm from "@/components/FoodMenuForm";

export default async function EditFoodMenuPage({
	params,
}: {
	params: Promise<{ barId: string; menuId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId, menuId } = await params;

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">
						フードメニュー編集
					</h1>
					<p className="mt-1 text-sm text-gray-600">
						フードメニュー情報を編集します
					</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<FoodMenuForm barId={barId} menuId={menuId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
