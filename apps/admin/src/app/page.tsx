import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardContent from "./DashboardContent";

export default async function Home() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<DashboardContent />
		</DashboardLayout>
	);
}
