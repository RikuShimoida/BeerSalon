import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import EventList from "./EventList";

export default async function EventsPage({
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
		<DashboardLayout userName={user.name} userRole={user.role}>
			<EventList barId={barId} />
		</DashboardLayout>
	);
}
