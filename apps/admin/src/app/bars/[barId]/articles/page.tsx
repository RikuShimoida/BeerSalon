import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import ArticleList from "./ArticleList";

export default async function ArticlesPage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<ArticleList barId={barId} userRole={user.role} />
		</DashboardLayout>
	);
}
