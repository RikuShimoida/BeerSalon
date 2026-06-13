import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
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

	if (user.role !== "bar_owner") {
		redirect("/bars");
	}

	const { barId, menuId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<BeerMenuEditForm barId={barId} menuId={menuId} />
		</DashboardLayout>
	);
}
