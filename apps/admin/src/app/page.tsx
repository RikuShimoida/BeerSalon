import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import DashboardContent from "./DashboardContent";

export default async function Home() {
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
			<DashboardContent />
		</DashboardLayout>
	);
}
