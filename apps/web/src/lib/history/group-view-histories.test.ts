import { describe, expect, it } from "vitest";
import {
	groupViewHistories,
	type ViewHistoryItem,
} from "./group-view-histories";

function makeItem(id: string, viewedAt: Date): ViewHistoryItem {
	return {
		id,
		viewedAt,
		bar: {
			id: `bar-${id}`,
			name: `店舗${id}`,
			prefecture: "静岡県",
			city: "静岡市",
		},
	};
}

describe("groupViewHistories", () => {
	// 2026-07-19 (日) 15:00 を基準時刻とする
	const now = new Date(2026, 6, 19, 15, 0, 0);

	it("当日0:00直後の履歴は Today に入る", () => {
		const todayMidnight = new Date(2026, 6, 19, 0, 0, 1);
		const groups = groupViewHistories([makeItem("a", todayMidnight)], now);

		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe("today");
		expect(groups[0].label).toBe("Today");
		expect(groups[0].items.map((i) => i.id)).toEqual(["a"]);
	});

	it("基準時刻より後（同日）の履歴も Today に入る", () => {
		const laterToday = new Date(2026, 6, 19, 23, 0, 0);
		const groups = groupViewHistories([makeItem("a", laterToday)], now);

		expect(groups[0].key).toBe("today");
	});

	it("前日〜6日前は This Week に入る", () => {
		const yesterday = new Date(2026, 6, 18, 23, 59, 0);
		const sixDaysAgoStart = new Date(2026, 6, 13, 0, 0, 0);
		const groups = groupViewHistories(
			[makeItem("a", yesterday), makeItem("b", sixDaysAgoStart)],
			now,
		);

		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe("thisWeek");
		expect(groups[0].label).toBe("This Week");
		expect(groups[0].items.map((i) => i.id)).toEqual(["a", "b"]);
	});

	it("6日前の0:00ちょうどは This Week に含まれる（境界値）", () => {
		const weekBoundary = new Date(2026, 6, 13, 0, 0, 0);
		const groups = groupViewHistories([makeItem("a", weekBoundary)], now);

		expect(groups[0].key).toBe("thisWeek");
	});

	it("7日前は This Week に含まれず それ以前 に入る（境界値）", () => {
		const beyondWeek = new Date(2026, 6, 12, 23, 59, 59);
		const groups = groupViewHistories([makeItem("a", beyondWeek)], now);

		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe("earlier");
		expect(groups[0].label).toBe("それ以前");
	});

	it("3グループが揃う場合は Today → This Week → それ以前 の順で返す", () => {
		const groups = groupViewHistories(
			[
				makeItem("today", new Date(2026, 6, 19, 10, 0, 0)),
				makeItem("week", new Date(2026, 6, 16, 10, 0, 0)),
				makeItem("earlier", new Date(2026, 6, 1, 10, 0, 0)),
			],
			now,
		);

		expect(groups.map((g) => g.key)).toEqual(["today", "thisWeek", "earlier"]);
	});

	it("該当が無いグループは返さない（空配列は除外される）", () => {
		const groups = groupViewHistories(
			[makeItem("earlier", new Date(2026, 6, 1, 10, 0, 0))],
			now,
		);

		expect(groups.map((g) => g.key)).toEqual(["earlier"]);
	});

	it("履歴が空なら空配列を返す", () => {
		expect(groupViewHistories([], now)).toEqual([]);
	});
});
