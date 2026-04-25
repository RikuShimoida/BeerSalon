import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import BeerMenuList from "./BeerMenuList";

export default async function BeerMenusPage({
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
			<BeerMenuList barId={barId} />
		</DashboardLayout>
	);
}
