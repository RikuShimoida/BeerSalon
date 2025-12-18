import { getNotifications } from "@/actions/notification";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { NotificationCard } from "@/components/notification/notification-card";

export default async function NotificationsPage() {
	const notifications = await getNotifications();

	return (
		<AuthenticatedLayout>
			<div className="max-w-3xl mx-auto px-4 py-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">通知</h1>

				{!notifications || notifications.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<p className="mb-2">通知はありません</p>
						<p className="text-sm">
							いいねやフォローなどの通知がここに表示されます
						</p>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						{notifications.map((notification) => (
							<NotificationCard
								key={notification.id}
								id={notification.id}
								type={notification.type}
								title={notification.title}
								message={notification.message}
								linkUrl={notification.linkUrl}
								isRead={notification.isRead}
								createdAt={notification.createdAt}
							/>
						))}
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	);
}
