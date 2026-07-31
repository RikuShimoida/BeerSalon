import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import {
	type BarDashboardMetrics,
	getBarDashboardMetrics,
} from "@/lib/dashboard-metrics";
import Dashboard from "./Dashboard";

export default async function Home() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	// Why not: admin は barId を持たず「自店」の概念が無いため、自店指標のダッシュボードは表示対象外。
	// 全店集計は用途が異なる別機能のため、従来どおり店舗一覧へ送る。
	if (user.role === "admin") {
		redirect("/bars");
	}

	// Why not: barId 未設定の bar_owner でも 500 にせず、防御的に全指標 0 のダッシュボードを見せる。
	const metrics: BarDashboardMetrics = user.barId
		? await getBarDashboardMetrics(user.barId)
		: { viewCount: 0, favoriteCount: 0, articleLikeCount: 0, postCount: 0 };

	return (
		<DashboardLayout
			userName={user.name}
			userRole={user.role}
			barId={user.barId}
		>
			<Dashboard metrics={metrics} />
		</DashboardLayout>
	);
}
