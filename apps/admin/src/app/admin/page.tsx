import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default async function AdminPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	// 管理者以外はアクセス不可
	if (user.role !== "admin") {
		redirect("/");
	}

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<div className="p-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">マスタ管理</h1>
				<p className="text-gray-600">マスタデータ管理機能は実装予定です</p>
			</div>
		</DashboardLayout>
	);
}
