export interface ViewHistoryItem {
	id: string;
	viewedAt: Date;
	bar: {
		id: string;
		name: string;
		prefecture: string;
		city: string;
		imageUrl?: string;
	};
}

export type ViewHistoryGroupKey = "today" | "thisWeek" | "earlier";

export interface ViewHistoryGroup {
	key: ViewHistoryGroupKey;
	label: string;
	items: ViewHistoryItem[];
}

const GROUP_LABELS: Record<ViewHistoryGroupKey, string> = {
	today: "Today",
	thisWeek: "This Week",
	earlier: "それ以前",
};

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Why not viewedAt を単純比較で振り分けない: 「今日」は暦日の 0:00 起点、「今週」は
// 今日を除く直近7日境界（今日の 0:00 から6日前の 0:00 まで）で判定する必要があり、
// 経過ミリ秒だけでは日付境界をまたぐケース（例: 昨夜と今朝）を正しく分けられないため。
export function groupViewHistories(
	histories: ViewHistoryItem[],
	now: Date = new Date(),
): ViewHistoryGroup[] {
	const todayStart = startOfDay(now);
	const weekStart = new Date(todayStart);
	weekStart.setDate(weekStart.getDate() - 6);

	const today: ViewHistoryItem[] = [];
	const thisWeek: ViewHistoryItem[] = [];
	const earlier: ViewHistoryItem[] = [];

	for (const item of histories) {
		const viewed = new Date(item.viewedAt);
		if (viewed >= todayStart) {
			today.push(item);
		} else if (viewed >= weekStart) {
			thisWeek.push(item);
		} else {
			earlier.push(item);
		}
	}

	const groups: ViewHistoryGroup[] = [];
	if (today.length > 0) {
		groups.push({ key: "today", label: GROUP_LABELS.today, items: today });
	}
	if (thisWeek.length > 0) {
		groups.push({
			key: "thisWeek",
			label: GROUP_LABELS.thisWeek,
			items: thisWeek,
		});
	}
	if (earlier.length > 0) {
		groups.push({
			key: "earlier",
			label: GROUP_LABELS.earlier,
			items: earlier,
		});
	}
	return groups;
}
