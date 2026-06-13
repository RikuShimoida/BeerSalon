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
