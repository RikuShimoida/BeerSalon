import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import BillingContent from "./BillingContent";
import { supabaseAdmin } from "@/lib/supabase";

export default async function BillingPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	let barId = null;
	if (user.role === "bar_owner") {
		const { data: barOwner } = await supabaseAdmin
			.from("bar_owners")
			.select("bar_id")
			.eq("admin_user_id", user.id)
			.single();

		barId = barOwner?.bar_id || null;
	}

	return (
		<DashboardLayout userName={user.name} userRole={user.role}>
			<BillingContent barId={barId} />
		</DashboardLayout>
	);
}
