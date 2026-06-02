import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import BarList from "./BarList";

export default async function BarsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role === "bar_owner" && user.barId) {
		redirect(`/bars/${user.barId}`);
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<BarList />
		</DashboardLayout>
	);
}
