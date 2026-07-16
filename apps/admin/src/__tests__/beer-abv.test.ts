import { describe, expect, it } from "vitest";
import { normalizeAbv } from "@/lib/beer-abv";

describe("normalizeAbv", () => {
	it("未指定（undefined）は null を返す（任意項目）", () => {
		expect(normalizeAbv(undefined)).toEqual({ ok: true, value: null });
	});

	it("null は null を返す", () => {
		expect(normalizeAbv(null)).toEqual({ ok: true, value: null });
	});

	it("空文字は null を返す", () => {
		expect(normalizeAbv("")).toEqual({ ok: true, value: null });
	});

	it("数値をそのまま値として返す", () => {
		expect(normalizeAbv(5.5)).toEqual({ ok: true, value: 5.5 });
	});

	it("数値文字列を数値へ変換して返す", () => {
		expect(normalizeAbv("6.25")).toEqual({ ok: true, value: 6.25 });
	});

	it("下限 0 を許容する", () => {
		expect(normalizeAbv(0)).toEqual({ ok: true, value: 0 });
	});

	it("上限 99.99 を許容する", () => {
		expect(normalizeAbv(99.99)).toEqual({ ok: true, value: 99.99 });
	});

	it("範囲外（上限超過）はエラーを返す", () => {
		const result = normalizeAbv(150);
		expect(result.ok).toBe(false);
	});

	it("範囲外（負数）はエラーを返す", () => {
		const result = normalizeAbv(-1);
		expect(result.ok).toBe(false);
	});

	it("非数値文字列はエラーを返す", () => {
		const result = normalizeAbv("abc");
		expect(result.ok).toBe(false);
	});
});
