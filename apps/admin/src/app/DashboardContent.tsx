"use client";

import { useEffect, useState } from "react";
import ActivityTimeline from "@/components/ActivityTimeline";
import StatsCard from "@/components/StatsCard";

interface Stats {
	barsCount: number;
	articlesCount: number;
	activeCouponsCount: number;
	monthlyViews: number;
}

interface Activity {
	id: string;
	type: string;
	title: string;
	date: string;
}

export default function DashboardContent() {
	const [stats, setStats] = useState<Stats>({
		barsCount: 0,
		articlesCount: 0,
		activeCouponsCount: 0,
		monthlyViews: 0,
	});
	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const [statsRes, activitiesRes] = await Promise.all([
					fetch("/api/dashboard/stats"),
					fetch("/api/dashboard/activities"),
				]);

				if (statsRes.ok) {
					const statsData = await statsRes.json();
					setStats(statsData);
				}

				if (activitiesRes.ok) {
					const activitiesData = await activitiesRes.json();
					setActivities(activitiesData);
				}
			} catch (_error) {
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	return (
		<div className="p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
				<p className="mt-1 text-sm text-gray-600">
					管理画面の概要を表示しています
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
				<StatsCard
					icon="🏪"
					title="登録バー数"
					value={stats.barsCount}
					loading={loading}
				/>
				<StatsCard
					icon="📝"
					title="今月の記事投稿数"
					value={stats.articlesCount}
					loading={loading}
				/>
				<StatsCard
					icon="🎫"
					title="アクティブクーポン"
					value={`${stats.activeCouponsCount} 件`}
					loading={loading}
				/>
				<StatsCard
					icon="📊"
					title="月間PV"
					value={stats.monthlyViews.toLocaleString()}
					loading={loading}
				/>
			</div>

			<ActivityTimeline activities={activities} loading={loading} />
		</div>
	);
}
