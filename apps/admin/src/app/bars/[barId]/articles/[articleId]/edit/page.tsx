import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import ArticleEditForm from "./ArticleEditForm";

export default async function EditArticlePage({
	params,
}: {
	params: Promise<{ barId: string; articleId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "bar_owner") {
		redirect("/bars");
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
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-gray-900">記事編集</h1>
				<ArticleEditForm barId={barId} articleId={articleId} />
			</div>
		</DashboardLayout>
	);
}
