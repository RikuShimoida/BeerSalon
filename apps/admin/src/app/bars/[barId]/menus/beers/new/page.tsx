import { redirect } from "next/navigation";
import BeerMenuForm from "@/components/BeerMenuForm";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";

export default async function NewBeerMenuPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId } = await params;

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">
						ビールメニュー追加
					</h1>
					<p className="mt-1 text-sm text-gray-600">
						ビールマスタから選択してメニューに追加します
					</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<BeerMenuForm barId={barId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
