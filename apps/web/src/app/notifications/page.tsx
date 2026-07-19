import { getNotifications } from "@/actions/notification";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { MarkAllReadButton } from "@/components/notification/mark-all-read-button";
import { NotificationCard } from "@/components/notification/notification-card";
import { groupNotificationsByDay } from "./group-notifications";

export default async function NotificationsPage() {
	const notifications = await getNotifications();
	const groups = notifications ? groupNotificationsByDay(notifications) : [];
	const hasUnread = notifications?.some((n) => !n.isRead) ?? false;

	return (
		<AuthenticatedLayout>
			<div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
				<div className="mb-6 flex items-center justify-between gap-4">
					<h1 className="font-mincho text-2xl font-bold text-heading">通知</h1>
					{hasUnread && <MarkAllReadButton />}
				</div>

				{!notifications || notifications.length === 0 ? (
					<div className="py-12 text-center text-subtext">
						<p className="mb-2">通知はありません</p>
						<p className="text-sm">
							いいねやフォローなどの通知がここに表示されます
						</p>
					</div>
				) : (
					<div className="space-y-8">
						{groups.map((group) => (
							<section key={group.key}>
								<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtext">
									{group.label}
								</p>
								<div className="space-y-3">
									{group.notifications.map((notification) => (
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
							</section>
						))}
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	);
}
