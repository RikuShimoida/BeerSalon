import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import ArticleDetail from "./ArticleDetail";

export default async function ArticleDetailPage({
	params,
}: {
	params: Promise<{ barId: string; articleId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const { barId, articleId } = await params;

	if (!canAccessBar(user, barId)) {
		redirect("/bars");
	}

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<ArticleDetail barId={barId} articleId={articleId} userRole={user.role} />
		</DashboardLayout>
	);
}
