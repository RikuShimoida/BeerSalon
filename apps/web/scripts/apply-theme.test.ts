import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractRootBlock, listThemes, replaceThemeBlock } from "./apply-theme";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(scriptDir, "..");
const themesDir = join(webRoot, "src", "styles", "themes");
const globalsPath = join(webRoot, "src", "app", "globals.css");

describe("extractRootBlock", () => {
	it(":root ブロックのみを抜き出す（前後のコメント・他セレクタは含めない）", () => {
		const css = `/* comment */\n:root {\n  --a: 1;\n  --b: #fff;\n}\n.other { color: red; }`;
		expect(extractRootBlock(css)).toBe(":root {\n  --a: 1;\n  --b: #fff;\n}");
	});

	it(":root が無い CSS はエラーになる", () => {
		expect(() => extractRootBlock(".foo { color: red; }")).toThrow(
			/:root ブロックが見つかりません/,
		);
	});
});

describe("replaceThemeBlock", () => {
	const base = [
		"header",
		"/* THEME:START */",
		":root {",
		"  --old: 1;",
		"}",
		"/* THEME:END */",
		"footer",
	].join("\n");

	it("マーカー間を新しい :root ブロックに差し替え、マーカー自体は残す", () => {
		const result = replaceThemeBlock(base, ":root {\n  --new: 2;\n}");
		expect(result).toBe(
			[
				"header",
				"/* THEME:START */",
				":root {",
				"  --new: 2;",
				"}",
				"/* THEME:END */",
				"footer",
			].join("\n"),
		);
	});

	it("繰り返し適用しても冪等（同じテーマを2回当てても結果が変わらない）", () => {
		const once = replaceThemeBlock(base, ":root {\n  --new: 2;\n}");
		const twice = replaceThemeBlock(once, ":root {\n  --new: 2;\n}");
		expect(twice).toBe(once);
	});

	it("current → amber-dark → current で元の内容に戻る", () => {
		const currentBlock =
			":root {\n  --surface-panel: rgba(21, 16, 10, 0.9);\n}";
		const darkBlock = ":root {\n  --surface-panel: #2a1c0e;\n}";
		const toDark = replaceThemeBlock(base, darkBlock);
		const backToCurrent = replaceThemeBlock(toDark, currentBlock);
		expect(replaceThemeBlock(base, currentBlock)).toBe(backToCurrent);
	});

	it("開始マーカーが無いとエラーになる", () => {
		expect(() => replaceThemeBlock("no markers here", ":root {}")).toThrow(
			/開始マーカー/,
		);
	});

	it("終了マーカーが無いとエラーになる", () => {
		expect(() =>
			replaceThemeBlock("/* THEME:START */\n:root {}", ":root {}"),
		).toThrow(/終了マーカー/);
	});
});

describe("テーマファイルと globals.css の整合", () => {
	it("current テーマの :root ブロックが globals.css の現在のブロックと一致する（デグレ検出）", () => {
		const globalsCss = readFileSync(globalsPath, "utf8");
		const currentCss = readFileSync(join(themesDir, "current.css"), "utf8");
		const currentBlock = extractRootBlock(currentCss);
		const reapplied = replaceThemeBlock(globalsCss, currentBlock);
		// current を適用しても globals.css が変わらない = 現在 globals.css は current テーマそのもの
		expect(reapplied).toBe(globalsCss);
	});

	it("amber-dark 適用で --surface-panel / --surface-control がダーク値に切り替わる", () => {
		const globalsCss = readFileSync(globalsPath, "utf8");
		const darkCss = readFileSync(join(themesDir, "amber-dark.css"), "utf8");
		const darkBlock = extractRootBlock(darkCss);
		const applied = replaceThemeBlock(globalsCss, darkBlock);
		expect(applied).toContain("--surface-panel: #2a1c0e;");
		expect(applied).toContain("--surface-control: #3d2b17;");
		// current 固有の帯色・白操作面は消えている
		expect(applied).not.toContain("--surface-panel: #e2d6bf;");
		expect(applied).not.toContain("--surface-control: #ffffff;");
	});

	it("listThemes が current / amber-dark / dark-taproom を返す", () => {
		const themes = listThemes(themesDir);
		expect(themes).toContain("current");
		expect(themes).toContain("amber-dark");
		// Issue #440: current と同内容の Dark Taproom 復元用テーマ
		expect(themes).toContain("dark-taproom");
	});

	it("dark-taproom テーマの :root ブロックが current.css と一致する（復元用の同一性）", () => {
		const currentCss = readFileSync(join(themesDir, "current.css"), "utf8");
		const darkTaproomCss = readFileSync(
			join(themesDir, "dark-taproom.css"),
			"utf8",
		);
		// コメント文言は異なるため、色トークンの実値が揃っていることを主要トークンで検査する
		for (const token of [
			"--background: #15100a;",
			"--primary: #e0a341;",
			"--heading: #f5e9d4;",
			"--surface-panel: rgba(21, 16, 10, 0.9);",
		]) {
			expect(currentCss).toContain(token);
			expect(darkTaproomCss).toContain(token);
		}
	});
});

describe("Dark Taproom 基盤（Issue #440）", () => {
	const globalsCss = readFileSync(globalsPath, "utf8");

	it("THEME ブロック（:root）が Dark Taproom の実 Hex トークンを実値で定義している", () => {
		const startIdx = globalsCss.indexOf("/* THEME:START");
		const endIdx = globalsCss.indexOf("/* THEME:END */");
		const themeBlock = globalsCss.slice(startIdx, endIdx);
		// 壊れた HSL 成分値ではなく実 Hex 値で定義され、bg-* / text-* が透明化しないこと
		expect(themeBlock).toContain("--background: #15100a;");
		expect(themeBlock).toContain("--card: #1e160d;");
		expect(themeBlock).toContain("--primary: #e0a341;");
		expect(themeBlock).toContain("--foreground: #e6d3ac;");
		expect(themeBlock).toContain("--heading: #f5e9d4;");
		// 旧ライト基調（透明化していた HSL 成分値・白操作面）が残っていないこと
		expect(themeBlock).not.toContain("--surface-control: #ffffff;");
		expect(themeBlock).not.toContain("--primary: 30 75% 45%;");
	});

	it("globals.css にトップ限定スコープ .top-amber-dark が残っている（撤去は別 Issue）", () => {
		expect(globalsCss).toContain(".top-amber-dark");
	});

	it("スコープ定義は THEME:START〜THEME:END の外にあり、テーマ切替ブロックを侵さない", () => {
		const startIdx = globalsCss.indexOf("/* THEME:START");
		const endIdx = globalsCss.indexOf("/* THEME:END */");
		const themeBlock = globalsCss.slice(startIdx, endIdx);
		// Why not スコープを :root(THEMEブロック)内に置く: そこへ書くと apply-theme が
		// 差し替え対象にしてテーマ切替で消える。スコープは THEME ブロックの外に置く。
		expect(themeBlock).not.toContain(".top-amber-dark");
	});

	it("@theme inline に明朝・Archivo のフォント変数が登録されている", () => {
		// next/font で読み込む Zen Old Mincho / Archivo を任意要素へ適用できること
		expect(globalsCss).toContain("--font-mincho: var(--font-mincho);");
		expect(globalsCss).toContain("--font-archivo: var(--font-archivo);");
		expect(globalsCss).toContain("--font-sans: var(--font-gothic);");
	});
});
