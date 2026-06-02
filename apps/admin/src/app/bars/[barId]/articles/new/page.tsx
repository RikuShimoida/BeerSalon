import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import ArticleCreateForm from "./ArticleCreateForm";

export default async function NewArticlePage({
	params,
}: {
	params: Promise<{ barId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "bar_owner") {
		redirect("/bars");
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
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-gray-900">記事投稿</h1>
				<ArticleCreateForm barId={barId} />
			</div>
		</DashboardLayout>
	);
}
