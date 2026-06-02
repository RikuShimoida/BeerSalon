import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import EventForm from "@/components/EventForm";
import { getCurrentUser } from "@/lib/auth";

export default async function NewEventPage({
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
					<h1 className="text-2xl font-bold text-gray-900">イベント追加</h1>
					<p className="mt-1 text-sm text-gray-600">
						新しいイベントを登録します
					</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<EventForm barId={barId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
