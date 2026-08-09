import { toJstDayNumber } from "@beersalon/shared";

export type NotificationGroupKey = "today" | "yesterday" | "earlier";

export const NOTIFICATION_GROUP_LABELS: Record<NotificationGroupKey, string> = {
	today: "今日",
	yesterday: "昨日",
	earlier: "それ以前",
};

// Why not: createdAt の生比較（過去24時間 / 48時間）ではなく暦日で判定する。
// 深夜1時に届いた通知を「今日」ではなく前日扱いにしないため、時刻を切り捨てた
// 日付の差で today / yesterday / earlier を分類する。
// 暦日は JST 固定で算出する（サーバー TZ が UTC の環境では、ローカル TZ getter だと
// JST 00:00〜08:59 の通知が丸ごと「昨日」に落ちるため）。
export function classifyNotificationGroup(
	createdAt: Date,
	now: Date = new Date(),
): NotificationGroupKey {
	const diffDays = toJstDayNumber(now) - toJstDayNumber(createdAt);
	if (diffDays <= 0) {
		return "today";
	}
	if (diffDays === 1) {
		return "yesterday";
	}
	return "earlier";
}

export type GroupedNotifications<T> = {
	key: NotificationGroupKey;
	label: string;
	notifications: T[];
};

export function groupNotificationsByDay<T extends { createdAt: Date }>(
	notifications: T[],
	now: Date = new Date(),
): GroupedNotifications<T>[] {
	const buckets: Record<NotificationGroupKey, T[]> = {
		today: [],
		yesterday: [],
		earlier: [],
	};

	for (const notification of notifications) {
		buckets[classifyNotificationGroup(notification.createdAt, now)].push(
			notification,
		);
	}

	const order: NotificationGroupKey[] = ["today", "yesterday", "earlier"];

	return order
		.filter((key) => buckets[key].length > 0)
		.map((key) => ({
			key,
			label: NOTIFICATION_GROUP_LABELS[key],
			notifications: buckets[key],
		}));
}
