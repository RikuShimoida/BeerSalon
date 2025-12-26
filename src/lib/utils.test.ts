import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	describe("正常系", () => {
		it("単一のクラス名を正しく返す", () => {
			const result = cn("text-red-500");
			expect(result).toBe("text-red-500");
		});

		it("複数のクラス名を結合して返す", () => {
			const result = cn("text-red-500", "bg-blue-500");
			expect(result).toBe("text-red-500 bg-blue-500");
		});

		it("条件付きクラス名を正しく処理する", () => {
			const isActive = true;
			const result = cn("base-class", isActive && "active-class");
			expect(result).toBe("base-class active-class");
		});

		it("falseの条件付きクラス名を除外する", () => {
			const isActive = false;
			const result = cn("base-class", isActive && "active-class");
			expect(result).toBe("base-class");
		});

		it("オブジェクト形式のクラス名を正しく処理する", () => {
			const result = cn({
				"text-red-500": true,
				"bg-blue-500": false,
				"p-4": true,
			});
			expect(result).toBe("text-red-500 p-4");
		});

		it("配列形式のクラス名を正しく処理する", () => {
			const result = cn(["text-red-500", "bg-blue-500"]);
			expect(result).toBe("text-red-500 bg-blue-500");
		});

		it("Tailwindの競合するクラスを正しくマージする", () => {
			const result = cn("px-2", "px-4");
			expect(result).toBe("px-4");
		});

		it("複雑な組み合わせを正しく処理する", () => {
			const isActive = true;
			const hasError = false;
			const result = cn(
				"base-class",
				isActive && "active",
				hasError && "error",
				{ disabled: false, enabled: true },
				["text-sm", "font-bold"],
			);
			expect(result).toBe("base-class active enabled text-sm font-bold");
		});
	});

	describe("エッジケース", () => {
		it("空の引数の場合、空文字列を返す", () => {
			const result = cn();
			expect(result).toBe("");
		});

		it("undefined を含む場合、正しく無視される", () => {
			const result = cn("text-red-500", undefined, "bg-blue-500");
			expect(result).toBe("text-red-500 bg-blue-500");
		});

		it("null を含む場合、正しく無視される", () => {
			const result = cn("text-red-500", null, "bg-blue-500");
			expect(result).toBe("text-red-500 bg-blue-500");
		});

		it("空文字列を含む場合、正しく無視される", () => {
			const result = cn("text-red-500", "", "bg-blue-500");
			expect(result).toBe("text-red-500 bg-blue-500");
		});

		it("重複したクラス名がある場合、マージされる", () => {
			const result = cn("text-red-500", "text-red-500");
			expect(result).toBe("text-red-500");
		});

		it("Tailwindの競合する複数のクラスで、最後のクラスが適用される", () => {
			const result = cn("p-2", "p-4", "p-6");
			expect(result).toBe("p-6");
		});
	});
});
