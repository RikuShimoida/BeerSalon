import { describe, expect, it } from "vitest";
import { isArticleStatus, resolveArticlePublishing } from "@/lib/validators";

const NOW = new Date("2026-06-22T00:00:00.000Z");

describe("isArticleStatus", () => {
	it("draft / published / scheduled を許可する", () => {
		expect(isArticleStatus("draft")).toBe(true);
		expect(isArticleStatus("published")).toBe(true);
		expect(isArticleStatus("scheduled")).toBe(true);
	});

	it("未知の文字列・非文字列は拒否する", () => {
		expect(isArticleStatus("archived")).toBe(false);
		expect(isArticleStatus("")).toBe(false);
		expect(isArticleStatus(null)).toBe(false);
		expect(isArticleStatus(undefined)).toBe(false);
		expect(isArticleStatus(1)).toBe(false);
	});
});

describe("resolveArticlePublishing", () => {
	it("不正な status は 400 相当のエラーを返す", () => {
		const result = resolveArticlePublishing("archived", null, NOW);
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("draft / published / scheduled");
		}
	});

	it("draft は published_at を null にする", () => {
		const result = resolveArticlePublishing(
			"draft",
			"2026-12-31T00:00:00.000Z",
			NOW,
		);
		expect(result).toEqual({
			isValid: true,
			status: "draft",
			published_at: null,
		});
	});

	it("published で published_at 未指定なら now を補完する", () => {
		const result = resolveArticlePublishing("published", null, NOW);
		expect(result).toEqual({
			isValid: true,
			status: "published",
			published_at: NOW.toISOString(),
		});
	});

	it("published で published_at 指定があればそれを維持する", () => {
		const existing = "2026-01-01T09:00:00.000Z";
		const result = resolveArticlePublishing("published", existing, NOW);
		expect(result).toEqual({
			isValid: true,
			status: "published",
			published_at: existing,
		});
	});

	it("scheduled で published_at 未指定なら 400 相当のエラー", () => {
		const result = resolveArticlePublishing("scheduled", null, NOW);
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("公開日時を指定");
		}
	});

	it("scheduled で過去日時なら 400 相当のエラー", () => {
		const past = "2026-06-21T23:59:59.000Z";
		const result = resolveArticlePublishing("scheduled", past, NOW);
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("未来の日時");
		}
	});

	it("scheduled で現在時刻ちょうどは 400 相当のエラー（境界値）", () => {
		const result = resolveArticlePublishing(
			"scheduled",
			NOW.toISOString(),
			NOW,
		);
		expect(result.isValid).toBe(false);
	});

	it("scheduled で未来日時なら ISO 文字列で受理する", () => {
		const future = "2026-12-31T10:00:00.000Z";
		const result = resolveArticlePublishing("scheduled", future, NOW);
		expect(result).toEqual({
			isValid: true,
			status: "scheduled",
			published_at: future,
		});
	});

	it("scheduled で不正な日時形式なら 400 相当のエラー", () => {
		const result = resolveArticlePublishing("scheduled", "not-a-date", NOW);
		expect(result.isValid).toBe(false);
		if (!result.isValid) {
			expect(result.error).toContain("形式");
		}
	});
});
