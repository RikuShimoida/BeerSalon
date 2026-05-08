import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import MenuHub from "./MenuHub";

export default async function MenusPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<MenuHub userRole={user.role} />
		</DashboardLayout>
	);
}
