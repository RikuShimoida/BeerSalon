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
		const currentBlock = ":root {\n  --surface-panel: #e2d6bf;\n}";
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

	it("listThemes が current と amber-dark を返す", () => {
		const themes = listThemes(themesDir);
		expect(themes).toContain("current");
		expect(themes).toContain("amber-dark");
	});
});

describe("トップページ限定ダークスコープ（#388 案A）", () => {
	const globalsCss = readFileSync(globalsPath, "utf8");

	it("globals.css にトップ限定スコープ .top-amber-dark が定義されている", () => {
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

	it("スコープ内で surface トークンを案Aのダーク値へ上書きしている", () => {
		const scopeIdx = globalsCss.indexOf(".top-amber-dark {");
		const scopeEnd = globalsCss.indexOf("}", scopeIdx);
		const scopeBlock = globalsCss.slice(scopeIdx, scopeEnd);
		expect(scopeBlock).toContain("--surface-panel: #2a1c0e;");
		expect(scopeBlock).toContain("--surface-control: #3d2b17;");
	});

	it("THEME ブロック（:root）は現行 current のライト値のまま（全画面ダーク化していない）", () => {
		const startIdx = globalsCss.indexOf("/* THEME:START");
		const endIdx = globalsCss.indexOf("/* THEME:END */");
		const themeBlock = globalsCss.slice(startIdx, endIdx);
		// current のライト基調（帯=ウォームサンド / 操作面=白）が :root に維持されていること
		expect(themeBlock).toContain("--surface-panel: #e2d6bf;");
		expect(themeBlock).toContain("--surface-control: #ffffff;");
	});
});
