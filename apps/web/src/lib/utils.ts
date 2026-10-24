import { formatDateJst } from "@beersalon/shared";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatRelativeTime(
	date: Date | string,
	now: Date = new Date(),
): string {
	const target = typeof date === "string" ? new Date(date) : date;
	const diffMs = now.getTime() - target.getTime();
	const diffSec = Math.floor(diffMs / 1000);

	// Why not 未来日時をそのまま「n前」にしない: サーバー/クライアントの時計差で
	// わずかに未来になった場合に「-1分前」等の不自然な表示を避けるため、0未満は「たった今」に丸める。
	if (diffSec < 60) {
		return "たった今";
	}

	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) {
		return `${diffMin}分前`;
	}

	const diffHour = Math.floor(diffMin / 60);
	if (diffHour < 24) {
		return `${diffHour}時間前`;
	}

	const diffDay = Math.floor(diffHour / 24);
	if (diffDay < 7) {
		return `${diffDay}日前`;
	}

	return formatDateJst(target);
}
