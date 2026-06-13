"use client";

import { useRouter } from "next/navigation";
import { markNotificationAsRead } from "@/actions/notification";

type NotificationCardProps = {
	id: string;
	type: string;
	title: string;
	message: string;
	linkUrl: string | null;
	isRead: boolean;
	createdAt: Date;
};

function getNotificationIcon(type: string): string {
	switch (type) {
		case "post_liked":
			return "❤️";
		case "followed":
			return "👤";
		case "new_article":
			return "📰";
		default:
			return "🔔";
	}
}

function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days}日前`;
	}
	if (hours > 0) {
		return `${hours}時間前`;
	}
	if (minutes > 0) {
		return `${minutes}分前`;
	}
	return "たった今";
}

export function NotificationCard({
	id,
	type,
	title,
	message,
	linkUrl,
	isRead,
	createdAt,
}: NotificationCardProps) {
	const router = useRouter();

	const handleClick = async () => {
		if (!isRead) {
			await markNotificationAsRead(id);
		}
		if (linkUrl) {
			router.push(linkUrl);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
				!isRead ? "bg-blue-50" : "bg-white"
			}`}
		>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 text-2xl">
					{getNotificationIcon(type)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-gray-900">{title}</p>
					<p className="text-sm text-gray-600 mt-1">{message}</p>
					<p className="text-xs text-gray-400 mt-1">
						{formatRelativeTime(createdAt)}
					</p>
				</div>
				<div className="flex-shrink-0">
					<svg
						className="w-5 h-5 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>詳細を見る</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</div>
			</div>
		</button>
	);
}
