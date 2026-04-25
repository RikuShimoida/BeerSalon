import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import BarEditForm from "./BarEditForm";

export default async function EditBarPage({
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
			<BarEditForm barId={barId} />
		</DashboardLayout>
	);
}
