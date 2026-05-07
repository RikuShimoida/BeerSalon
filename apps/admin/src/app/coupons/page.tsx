import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";

export default async function CouponsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<div className="p-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">クーポン管理</h1>
				<p className="text-gray-600">クーポン管理機能は実装予定です</p>
			</div>
		</DashboardLayout>
	);
}
