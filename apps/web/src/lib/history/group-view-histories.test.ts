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
	// Why not `new Date(2026, 6, 19, 15, 0, 0)` を使うか: この形式は実行環境の TZ で
	// 解釈されるため、実装と期待値が同時にずれて TZ 依存のバグを検出できない。
	// JST オフセットを明示して、どの TZ で実行しても同じ瞬間を指すようにする。
	// 2026-07-19 (日) 15:00 JST を基準時刻とする
	const now = new Date("2026-07-19T15:00:00+09:00");

	it("当日0:00直後の履歴は Today に入る", () => {
		const todayMidnight = new Date("2026-07-19T00:00:01+09:00");
		const groups = groupViewHistories([makeItem("a", todayMidnight)], now);

		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe("today");
		expect(groups[0].label).toBe("Today");
		expect(groups[0].items.map((i) => i.id)).toEqual(["a"]);
	});

	it("JST 早朝の履歴も Today に入る（UTC 環境では前日に落ちやすい境界）", () => {
		// 2026-07-19T05:00+09:00 === 2026-07-18T20:00Z。UTC の暦日は 7/18 だが JST では 7/19。
		const earlyMorning = new Date("2026-07-19T05:00:00+09:00");
		const groups = groupViewHistories([makeItem("a", earlyMorning)], now);

		expect(groups[0].key).toBe("today");
	});

	it("基準時刻より後（同日）の履歴も Today に入る", () => {
		const laterToday = new Date("2026-07-19T23:00:00+09:00");
		const groups = groupViewHistories([makeItem("a", laterToday)], now);

		expect(groups[0].key).toBe("today");
	});

	it("前日〜6日前は This Week に入る", () => {
		const yesterday = new Date("2026-07-18T23:59:00+09:00");
		const sixDaysAgoStart = new Date("2026-07-13T00:00:00+09:00");
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
		const weekBoundary = new Date("2026-07-13T00:00:00+09:00");
		const groups = groupViewHistories([makeItem("a", weekBoundary)], now);

		expect(groups[0].key).toBe("thisWeek");
	});

	it("7日前は This Week に含まれず それ以前 に入る（境界値）", () => {
		const beyondWeek = new Date("2026-07-12T23:59:59+09:00");
		const groups = groupViewHistories([makeItem("a", beyondWeek)], now);

		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe("earlier");
		expect(groups[0].label).toBe("それ以前");
	});

	it("3グループが揃う場合は Today → This Week → それ以前 の順で返す", () => {
		const groups = groupViewHistories(
			[
				makeItem("today", new Date("2026-07-19T10:00:00+09:00")),
				makeItem("week", new Date("2026-07-16T10:00:00+09:00")),
				makeItem("earlier", new Date("2026-07-01T10:00:00+09:00")),
			],
			now,
		);

		expect(groups.map((g) => g.key)).toEqual(["today", "thisWeek", "earlier"]);
	});

	it("該当が無いグループは返さない（空配列は除外される）", () => {
		const groups = groupViewHistories(
			[makeItem("earlier", new Date("2026-07-01T10:00:00+09:00"))],
			now,
		);

		expect(groups.map((g) => g.key)).toEqual(["earlier"]);
	});

	it("履歴が空なら空配列を返す", () => {
		expect(groupViewHistories([], now)).toEqual([]);
	});
});
