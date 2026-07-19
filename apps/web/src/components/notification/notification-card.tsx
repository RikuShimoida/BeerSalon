"use client";

import { Bell, ChevronRight, Heart, Newspaper, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
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

type IconStyle = {
	Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	className: string;
};

function getNotificationIconStyle(type: string): IconStyle {
	switch (type) {
		case "post_liked":
			return {
				Icon: Heart,
				className: "bg-destructive/15 text-destructive",
			};
		case "followed":
			return {
				Icon: UserPlus,
				className: "bg-primary/15 text-primary",
			};
		case "new_article":
			return {
				Icon: Newspaper,
				className: "bg-surface-raised text-primary",
			};
		default:
			return {
				Icon: Bell,
				className: "bg-surface-raised text-subtext",
			};
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
	const { Icon, className: iconClassName } = getNotificationIconStyle(type);

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
			className={`relative w-full rounded-2xl border p-4 text-left transition-colors ${
				isRead
					? "border-border bg-card hover:bg-surface-raised"
					: "border-primary/40 bg-primary/5 hover:bg-primary/10"
			}`}
		>
			{!isRead && (
				<span
					aria-hidden="true"
					className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-primary"
				/>
			)}
			<div className="flex items-start gap-3">
				<div
					className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}
				>
					<Icon className="h-5 w-5" aria-hidden />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-heading">{title}</p>
					<p className="mt-1 text-sm text-foreground">{message}</p>
					<p className="mt-1 text-xs text-subtext">
						{formatRelativeTime(createdAt)}
					</p>
				</div>
				<div className="flex flex-shrink-0 items-center gap-2 self-center">
					{!isRead && (
						<span
							aria-hidden="true"
							className="hidden h-2 w-2 rounded-full bg-primary md:block"
						/>
					)}
					<ChevronRight className="h-5 w-5 text-subtext" aria-hidden="true" />
				</div>
			</div>
		</button>
	);
}
