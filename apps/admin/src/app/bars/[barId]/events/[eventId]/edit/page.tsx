import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import EventForm from "@/components/EventForm";
import { canAccessBar, getCurrentUser } from "@/lib/auth";

export default async function EditEventPage({
	params,
}: {
	params: Promise<{ barId: string; eventId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "bar_owner") {
		redirect("/bars");
	}

	const { barId, eventId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">イベント編集</h1>
					<p className="mt-1 text-sm text-gray-600">イベント情報を編集します</p>
				</div>

				<div className="bg-white shadow rounded-lg p-6">
					<EventForm barId={barId} eventId={eventId} />
				</div>
			</div>
		</DashboardLayout>
	);
}
