import { describe, expect, it } from "vitest";
import {
	APP_TIME_ZONE,
	formatDateJst,
	formatDateLongJst,
	formatDateTimeJst,
	formatDateTimeLongJst,
	formatDateTimeWithSecondsJst,
} from "./format-date";

/**
 * このテストは実行環境の TZ を書き換えない。
 *
 * `process.env.TZ` の実行時書き換えは Node の Intl キャッシュが効いて不安定なうえ、
 * フォーマッタが `timeZone` を明示指定している以上、TZ に依存しないことこそが検証対象になる。
 * ローカル（JST）でも CI（UTC）でも同じ期待値で通ることが、この不具合が再発していない証拠になる。
 */
describe("JST フォーマッタ", () => {
	// JST 08:00 = UTC 前日 23:00。timeZone 未指定だと日付が1日巻き戻る境界データ。
	const jstEarlyMorning = "2026-09-02T08:00:00+09:00";

	describe("formatDateJst", () => {
		it("JST 08:00 のデータを前日に戻さず当日の日付で返す", () => {
			expect(formatDateJst(jstEarlyMorning)).toBe("2026/9/2");
		});

		it("JST 00:00（日付の下側の境界）で日付が巻き戻らない", () => {
			expect(formatDateJst("2026-09-02T00:00:00+09:00")).toBe("2026/9/2");
		});

		it("JST 08:59（UTC とずれる時間帯の上端）で日付が巻き戻らない", () => {
			expect(formatDateJst("2026-09-02T08:59:59+09:00")).toBe("2026/9/2");
		});

		it("JST 09:00（UTC と日付が一致し始める時刻）で日付が変わらない", () => {
			expect(formatDateJst("2026-09-02T09:00:00+09:00")).toBe("2026/9/2");
		});

		it("JST 23:59（日付の上側の境界）で翌日に進まない", () => {
			expect(formatDateJst("2026-09-02T23:59:59+09:00")).toBe("2026/9/2");
		});

		it("UTC 表記で渡された同一時刻も JST の日付として解釈する", () => {
			// UTC 2026-09-01T23:00:00Z は JST 2026-09-02T08:00:00 と同一の瞬間。
			expect(formatDateJst("2026-09-01T23:00:00Z")).toBe("2026/9/2");
		});

		it("Date インスタンスを受け取れる", () => {
			expect(formatDateJst(new Date(jstEarlyMorning))).toBe("2026/9/2");
		});

		it("エポックミリ秒を受け取れる", () => {
			expect(formatDateJst(new Date(jstEarlyMorning).getTime())).toBe(
				"2026/9/2",
			);
		});
	});

	describe("formatDateLongJst", () => {
		it("JST 08:00 のデータを和文表記で当日として返す", () => {
			expect(formatDateLongJst(jstEarlyMorning)).toBe("2026年9月2日");
		});

		it("@db.Date 由来の UTC 深夜値を同じ日付のまま返す", () => {
			// Prisma は DATE 型を UTC 深夜（1996-05-20T00:00:00Z）で返す。
			// JST 変換は +09:00 なので同日内に収まり、生年月日は前後しない。
			expect(formatDateLongJst("1996-05-20T00:00:00Z")).toBe("1996年5月20日");
		});
	});

	describe("formatDateTimeLongJst", () => {
		it("JST 08:00 の時刻を9時間ずらさずに返す", () => {
			const result = formatDateTimeLongJst(jstEarlyMorning);
			expect(result).toContain("2026年9月2日");
			expect(result).toContain("08:00");
			expect(result).not.toContain("23:00");
		});
	});

	describe("formatDateTimeJst", () => {
		it("JST 08:00 の日付と時刻を桁揃えで返す", () => {
			const result = formatDateTimeJst(jstEarlyMorning);
			expect(result).toContain("2026/09/02");
			expect(result).toContain("08:00");
		});

		it("JST 00:30 が前日 15:30 にならない", () => {
			const result = formatDateTimeJst("2026-09-02T00:30:00+09:00");
			expect(result).toContain("2026/09/02");
			expect(result).toContain("00:30");
			expect(result).not.toContain("09/01");
		});
	});

	describe("formatDateTimeWithSecondsJst", () => {
		it("秒まで含めて JST で返す", () => {
			const result = formatDateTimeWithSecondsJst("2026-09-02T08:00:45+09:00");
			expect(result).toContain("2026/09/02");
			expect(result).toContain("08:00:45");
		});
	});

	describe("異常系", () => {
		const formatters = [
			["formatDateJst", formatDateJst],
			["formatDateLongJst", formatDateLongJst],
			["formatDateTimeLongJst", formatDateTimeLongJst],
			["formatDateTimeJst", formatDateTimeJst],
			["formatDateTimeWithSecondsJst", formatDateTimeWithSecondsJst],
		] as const;

		for (const [name, formatter] of formatters) {
			it(`${name} は null に対して既定の空文字を返す`, () => {
				expect(formatter(null)).toBe("");
			});

			it(`${name} は undefined に対して既定の空文字を返す`, () => {
				expect(formatter(undefined)).toBe("");
			});

			it(`${name} は空文字に対して既定の空文字を返す`, () => {
				expect(formatter("")).toBe("");
			});

			it(`${name} は不正な日付文字列で例外を投げずフォールバックを返す`, () => {
				expect(formatter("not-a-date", "未設定")).toBe("未設定");
			});

			it(`${name} は指定したフォールバック文字列を返す`, () => {
				expect(formatter(null, "未設定")).toBe("未設定");
			});
		}
	});

	describe("APP_TIME_ZONE", () => {
		it("Asia/Tokyo を指す", () => {
			expect(APP_TIME_ZONE).toBe("Asia/Tokyo");
		});
	});
});
