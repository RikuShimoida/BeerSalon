import { describe, expect, it } from "vitest";
import { calcPasswordStrength } from "./password-strength";

describe("calcPasswordStrength", () => {
	it("空文字は0を返す", () => {
		expect(calcPasswordStrength("")).toBe(0);
	});

	it("8文字未満・小文字のみは1（小文字条件のみ）", () => {
		expect(calcPasswordStrength("abc")).toBe(1);
	});

	it("8文字以上・小文字のみは2（長さ+小文字）", () => {
		expect(calcPasswordStrength("abcdefgh")).toBe(2);
	});

	it("8文字以上・小文字+大文字は3", () => {
		expect(calcPasswordStrength("abcdefgH")).toBe(3);
	});

	it("8文字以上・小文字+大文字+数字は4（最大）", () => {
		expect(calcPasswordStrength("Password123")).toBe(4);
	});

	it("8文字未満でも大文字+数字を含めば条件数分カウントする", () => {
		// 大文字 + 数字 = 2条件（長さ未達）
		expect(calcPasswordStrength("A1")).toBe(2);
	});

	it("4条件を超えても4で頭打ちになる", () => {
		expect(calcPasswordStrength("Password123!@#")).toBe(4);
	});
});
