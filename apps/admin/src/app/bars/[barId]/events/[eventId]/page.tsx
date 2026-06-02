import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import EventDetail from "./EventDetail";

export default async function EventDetailPage({
	params,
}: {
	params: Promise<{ barId: string; eventId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
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
			<EventDetail barId={barId} eventId={eventId} userRole={user.role} />
		</DashboardLayout>
	);
}
