import { describe, expect, it } from "vitest";
import { toDateTimeLocalValue } from "./datetime-local";

// vitest.config.ts で TZ=Asia/Tokyo を固定しているため、ローカル時刻は JST（UTC+9）として評価される。
// 実行環境の TZ に依存すると「ローカルでは通るが CI で落ちる」テストになるため、TZ は必ず固定する。
describe("toDateTimeLocalValue", () => {
	it("UTC の日時をローカル時刻（JST）の datetime-local 値へ変換する", () => {
		// 09:00 UTC は 18:00 JST。datetime-local はローカル時刻として解釈されるため 18:00 を渡す必要がある。
		expect(toDateTimeLocalValue("2026-09-01T09:00:00+00:00")).toBe(
			"2026-09-01T18:00",
		);
	});

	it("日付をまたぐ場合も正しく繰り上がる", () => {
		// 23:30 UTC は翌日 08:30 JST。
		expect(toDateTimeLocalValue("2026-09-01T23:30:00+00:00")).toBe(
			"2026-09-02T08:30",
		);
	});

	it("月をまたぐ場合も正しく繰り上がる", () => {
		// 2026-08-31 15:00 UTC は 2026-09-01 00:00 JST。
		expect(toDateTimeLocalValue("2026-08-31T15:00:00+00:00")).toBe(
			"2026-09-01T00:00",
		);
	});

	it("月・日・時・分を2桁ゼロ埋めする", () => {
		// 2026-01-04 20:05 UTC は 2026-01-05 05:05 JST。
		expect(toDateTimeLocalValue("2026-01-04T20:05:00+00:00")).toBe(
			"2026-01-05T05:05",
		);
	});

	it("Date オブジェクトを受け取れる", () => {
		expect(toDateTimeLocalValue(new Date("2026-09-01T09:00:00+00:00"))).toBe(
			"2026-09-01T18:00",
		);
	});

	it("null / undefined / 空文字は空文字を返す", () => {
		expect(toDateTimeLocalValue(null)).toBe("");
		expect(toDateTimeLocalValue(undefined)).toBe("");
		expect(toDateTimeLocalValue("")).toBe("");
	});

	it("不正な日時文字列は空文字を返す", () => {
		expect(toDateTimeLocalValue("not-a-date")).toBe("");
	});

	// #559 の回帰防止。
	// 「フォームに表示 → 日時を触らず保存」で値が変化しないことが本修正の受入条件。
	it("表示→保存の往復で日時が変化しない（9時間ずれの回帰防止）", () => {
		const storedUtc = "2026-09-01T09:00:00.000Z";

		// 編集フォームに表示する値
		const formValue = toDateTimeLocalValue(storedUtc);
		expect(formValue).toBe("2026-09-01T18:00");

		// 日時を触らずそのまま保存した場合、送信側は new Date(formValue).toISOString() で UTC に戻す
		const resaved = new Date(formValue).toISOString();

		expect(resaved).toBe(storedUtc);
	});

	it("表示→保存を2回繰り返しても日時が累積でずれない", () => {
		const storedUtc = "2026-09-01T09:00:00.000Z";

		let current = storedUtc;
		for (let i = 0; i < 2; i++) {
			current = new Date(toDateTimeLocalValue(current)).toISOString();
		}

		expect(current).toBe(storedUtc);
	});
});
