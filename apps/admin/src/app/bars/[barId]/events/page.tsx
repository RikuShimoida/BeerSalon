import DashboardLayout from "@/components/DashboardLayout";
import { requireBarAccess } from "@/lib/auth";
import EventList from "./EventList";

export default async function EventsPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const { barId } = await params;
	const user = await requireBarAccess(barId);

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<EventList barId={barId} userRole={user.role} />
		</DashboardLayout>
	);
}
