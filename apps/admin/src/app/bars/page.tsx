import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import BarList from "./BarList";

export default async function BarsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<BarList />
		</DashboardLayout>
	);
}
