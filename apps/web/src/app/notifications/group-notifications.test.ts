import { describe, expect, it } from "vitest";
import {
	classifyNotificationGroup,
	groupNotificationsByDay,
} from "./group-notifications";

// Why not TZ レスの日付リテラル（"2026-07-19T10:00:00"）を使うか: オフセットを省くと
// 実行環境の TZ で解釈されるため、実装と期待値が同時にずれて TZ 依存のバグを検出できない。
// JST オフセットを明示して、どの TZ で実行しても同じ瞬間を指すようにする。
const NOW = new Date("2026-07-19T10:00:00+09:00");

describe("classifyNotificationGroup", () => {
	it("同じ暦日は today に分類する（深夜1時でも today）", () => {
		expect(
			classifyNotificationGroup(new Date("2026-07-19T01:00:00+09:00"), NOW),
		).toBe("today");
	});

	it("JST 深夜0時台の通知も today に分類する（UTC 環境では前日に落ちやすい境界）", () => {
		// 2026-07-19T00:30+09:00 === 2026-07-18T15:30Z。UTC の暦日は 7/18 だが JST では 7/19。
		expect(
			classifyNotificationGroup(new Date("2026-07-19T00:30:00+09:00"), NOW),
		).toBe("today");
	});

	it("前日は yesterday に分類する", () => {
		expect(
			classifyNotificationGroup(new Date("2026-07-18T23:59:00+09:00"), NOW),
		).toBe("yesterday");
	});

	it("2日前は earlier に分類する", () => {
		expect(
			classifyNotificationGroup(new Date("2026-07-17T23:59:00+09:00"), NOW),
		).toBe("earlier");
	});

	it("24時間以内でも暦日が前日なら yesterday（生の経過時間ではなく暦日で判定）", () => {
		// now(7/19 10:00 JST) から 20 時間前 = 7/18 14:00 JST → 経過は24時間未満だが暦日は前日
		expect(
			classifyNotificationGroup(new Date("2026-07-18T14:00:00+09:00"), NOW),
		).toBe("yesterday");
	});
});

describe("groupNotificationsByDay", () => {
	it("today / yesterday / earlier の順に、該当のあるグループのみ返す", () => {
		const notifications = [
			{ id: "a", createdAt: new Date("2026-07-19T09:00:00+09:00") },
			{ id: "b", createdAt: new Date("2026-07-18T09:00:00+09:00") },
			{ id: "c", createdAt: new Date("2026-07-10T09:00:00+09:00") },
			{ id: "d", createdAt: new Date("2026-07-19T08:00:00+09:00") },
		];

		const groups = groupNotificationsByDay(notifications, NOW);

		expect(groups.map((g) => g.key)).toEqual(["today", "yesterday", "earlier"]);
		expect(groups[0].label).toBe("今日");
		expect(groups[0].notifications.map((n) => n.id)).toEqual(["a", "d"]);
		expect(groups[1].notifications.map((n) => n.id)).toEqual(["b"]);
		expect(groups[2].notifications.map((n) => n.id)).toEqual(["c"]);
	});

	it("該当のないグループは省略する（yesterday が無ければ today と earlier のみ）", () => {
		const notifications = [
			{ id: "a", createdAt: new Date("2026-07-19T09:00:00+09:00") },
			{ id: "c", createdAt: new Date("2026-07-10T09:00:00+09:00") },
		];

		const groups = groupNotificationsByDay(notifications, NOW);

		expect(groups.map((g) => g.key)).toEqual(["today", "earlier"]);
	});

	it("空配列なら空配列を返す", () => {
		expect(groupNotificationsByDay([], NOW)).toEqual([]);
	});
});
