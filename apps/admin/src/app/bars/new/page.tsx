import { redirect } from "next/navigation";
import BarForm from "@/components/BarForm";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";

export default async function NewBarPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">バー新規登録</h1>
					<p className="mt-1 text-sm text-gray-600">
						新しいバーの情報を入力してください
					</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<BarForm />
				</div>
			</div>
		</DashboardLayout>
	);
}
