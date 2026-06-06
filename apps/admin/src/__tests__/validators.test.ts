import { describe, expect, it } from "vitest";
import { validateLineUrl } from "@/lib/validators";

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

	it("https://で始まるURLはバリデーションを通過する", () => {
		expect(validateLineUrl("https://line.me/R/ti/p/@example")).toEqual({
			isValid: true,
		});
	});

	it("https://lin.eeのURLもバリデーションを通過する", () => {
		expect(validateLineUrl("https://lin.ee/example")).toEqual({
			isValid: true,
		});
	});

	it("https://page.line.meのURLもバリデーションを通過する", () => {
		expect(validateLineUrl("https://page.line.me/example")).toEqual({
			isValid: true,
		});
	});

	it("http://で始まるURLはバリデーションに失敗する", () => {
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

	it("エラーメッセージにhttps://の案内が含まれる", () => {
		const result = validateLineUrl("not-a-url");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("https://");
	});
});
