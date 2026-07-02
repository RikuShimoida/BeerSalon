import { describe, expect, it } from "vitest";
import {
	validateCoordinates,
	validateLineUrl,
	validateOpeningHours,
} from "@/lib/validators";

describe("validateLineUrl", () => {
	it("空文字列の場合はバリデーションを通過する", () => {
		expect(validateLineUrl("")).toEqual({ isValid: true });
	});

	it("nullの場合はバリデーションを通過する", () => {
		expect(validateLineUrl(null)).toEqual({ isValid: true });
	});

	it("undefinedの場合はバリデーションを通過する", () => {
		expect(validateLineUrl(undefined)).toEqual({ isValid: true });
	});

	it("空白のみの場合はバリデーションを通過する", () => {
		expect(validateLineUrl("   ")).toEqual({ isValid: true });
	});

	it("https://line.me のURLはバリデーションを通過する", () => {
		expect(validateLineUrl("https://line.me/R/ti/p/@example")).toEqual({
			isValid: true,
		});
	});

	it("https://lin.ee のURLはバリデーションを通過する", () => {
		expect(validateLineUrl("https://lin.ee/example")).toEqual({
			isValid: true,
		});
	});

	it("https://page.line.me のURLはバリデーションを通過する", () => {
		expect(validateLineUrl("https://page.line.me/example")).toEqual({
			isValid: true,
		});
	});

	it("https://liff.line.me のURLはバリデーションを通過する", () => {
		expect(validateLineUrl("https://liff.line.me/1234567890-abcdefgh")).toEqual(
			{
				isValid: true,
			},
		);
	});

	it("LINE公式ドメイン以外のHTTPS URLはバリデーションに失敗する", () => {
		const result = validateLineUrl("https://example.com/line");
		expect(result.isValid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("http://で始まるLINE URLはバリデーションに失敗する", () => {
		const result = validateLineUrl("http://line.me/R/ti/p/@example");
		expect(result.isValid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("httpsなしのURLはバリデーションに失敗する", () => {
		const result = validateLineUrl("line.me/R/ti/p/@example");
		expect(result.isValid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("プロトコルなしのテキストはバリデーションに失敗する", () => {
		const result = validateLineUrl("just-text");
		expect(result.isValid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("エラーメッセージにline.meの案内が含まれる", () => {
		const result = validateLineUrl("not-a-url");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("line.me");
	});
});

describe("validateCoordinates", () => {
	it("緯度・経度がともに未入力（空文字）の場合は通過し null に正規化する", () => {
		expect(validateCoordinates("", "")).toEqual({
			isValid: true,
			latitude: null,
			longitude: null,
		});
	});

	it("緯度・経度がともに null の場合は通過し null に正規化する", () => {
		expect(validateCoordinates(null, null)).toEqual({
			isValid: true,
			latitude: null,
			longitude: null,
		});
	});

	it("緯度・経度がともに undefined の場合は通過し null に正規化する", () => {
		expect(validateCoordinates(undefined, undefined)).toEqual({
			isValid: true,
			latitude: null,
			longitude: null,
		});
	});

	it("有効な数値文字列を数値へ変換して返す", () => {
		expect(validateCoordinates("35.0116", "135.7681")).toEqual({
			isValid: true,
			latitude: 35.0116,
			longitude: 135.7681,
		});
	});

	it("数値型の入力もそのまま受け付ける", () => {
		expect(validateCoordinates(34.9756, 138.3828)).toEqual({
			isValid: true,
			latitude: 34.9756,
			longitude: 138.3828,
		});
	});

	it("緯度のみ入力・経度未入力でも通過する（片方だけ許容）", () => {
		expect(validateCoordinates("35", "")).toEqual({
			isValid: true,
			latitude: 35,
			longitude: null,
		});
	});

	it("経度のみ入力・緯度未入力でも通過する（片方だけ許容）", () => {
		expect(validateCoordinates("", "135")).toEqual({
			isValid: true,
			latitude: null,
			longitude: 135,
		});
	});

	it("緯度・経度の境界値（-90/90, -180/180）は通過する", () => {
		expect(validateCoordinates("-90", "-180")).toEqual({
			isValid: true,
			latitude: -90,
			longitude: -180,
		});
		expect(validateCoordinates("90", "180")).toEqual({
			isValid: true,
			latitude: 90,
			longitude: 180,
		});
	});

	it("緯度が範囲下限を下回る場合は失敗する", () => {
		const result = validateCoordinates("-90.1", "0");
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("緯度");
			expect(result.error).toContain("-90");
		}
	});

	it("緯度が範囲上限を上回る場合は失敗する", () => {
		const result = validateCoordinates("90.1", "0");
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("緯度");
		}
	});

	it("経度が範囲下限を下回る場合は失敗する", () => {
		const result = validateCoordinates("0", "-180.1");
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("経度");
			expect(result.error).toContain("-180");
		}
	});

	it("経度が範囲上限を上回る場合は失敗する", () => {
		const result = validateCoordinates("0", "180.1");
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("経度");
		}
	});

	it("緯度が数値に変換できない文字列の場合は失敗する", () => {
		const result = validateCoordinates("北緯35度", "135");
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("緯度");
			expect(result.error).toContain("数値");
		}
	});

	it("経度が数値に変換できない文字列の場合は失敗する", () => {
		const result = validateCoordinates("35", "abc");
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("経度");
			expect(result.error).toContain("数値");
		}
	});
});

describe("validateOpeningHours", () => {
	it("正常な非定休日の行を通過する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 0,
					open_time: "17:00",
					close_time: "23:00",
					sort_order: 0,
					is_closed: false,
				},
			]),
		).toEqual({ isValid: true });
	});

	it("定休日の行は時刻検証をスキップして通過する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 1,
					open_time: "",
					close_time: "",
					sort_order: 0,
					is_closed: true,
				},
			]),
		).toEqual({ isValid: true });
	});

	it("時刻未入力かつ非定休日の行は時刻検証の対象外で通過する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 2,
					open_time: "",
					close_time: "",
					sort_order: 0,
					is_closed: false,
				},
			]),
		).toEqual({ isValid: true });
	});

	it("day_of_week が範囲外（7）の場合は失敗する", () => {
		const result = validateOpeningHours([
			{
				day_of_week: 7,
				open_time: "17:00",
				close_time: "23:00",
				sort_order: 0,
				is_closed: false,
			},
		]);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("営業時間の指定が正しくありません");
	});

	it("day_of_week が整数でない場合は失敗する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 1.5,
					open_time: "17:00",
					close_time: "23:00",
					sort_order: 0,
					is_closed: false,
				},
			]).isValid,
		).toBe(false);
	});

	it("sort_order が整数でない場合は失敗する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 0,
					open_time: "17:00",
					close_time: "23:00",
					sort_order: 1.5,
					is_closed: false,
				},
			]).isValid,
		).toBe(false);
	});

	it("is_closed が boolean でない場合は失敗する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 0,
					open_time: "17:00",
					close_time: "23:00",
					sort_order: 0,
					is_closed: "false",
				},
			]).isValid,
		).toBe(false);
	});

	it("open_time が不正形式（25:00）の場合は失敗する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 0,
					open_time: "25:00",
					close_time: "23:00",
					sort_order: 0,
					is_closed: false,
				},
			]).isValid,
		).toBe(false);
	});

	it("close_time が不正形式（23:99）の場合は失敗する", () => {
		expect(
			validateOpeningHours([
				{
					day_of_week: 0,
					open_time: "17:00",
					close_time: "23:99",
					sort_order: 0,
					is_closed: false,
				},
			]).isValid,
		).toBe(false);
	});

	it("要素がオブジェクトでない場合は失敗する", () => {
		expect(validateOpeningHours(["invalid"]).isValid).toBe(false);
	});

	it("空配列は通過する", () => {
		expect(validateOpeningHours([])).toEqual({ isValid: true });
	});
});
