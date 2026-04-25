import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import BeerMenuEditForm from "./BeerMenuEditForm";

export default async function EditBeerMenuPage({
	params,
}: {
	params: Promise<{ barId: string; menuId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId, menuId } = await params;

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<BeerMenuEditForm barId={barId} menuId={menuId} />
		</DashboardLayout>
	);
}
