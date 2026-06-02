import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import BarNewForm from "./BarNewForm";

export default async function NewBarPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "admin") {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<BarNewForm />
		</DashboardLayout>
	);
}
