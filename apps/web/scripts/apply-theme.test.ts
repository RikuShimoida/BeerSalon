import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractRootBlock, listThemes, replaceThemeBlock } from "./apply-theme";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(scriptDir, "..");
const themesDir = join(webRoot, "src", "styles", "themes");
const globalsPath = join(webRoot, "src", "app", "globals.css");

/**
 * テーマ CSS から `--token: value;` 形式の宣言行だけを抽出して並べる。
 * コメント（`/* ... *​/`）や `:root {` / `}` などの構造行は落とすため、
 * コメント文言だけが異なる2ファイルでもトークンの完全一致を検査できる。
 */
function extractDeclarations(css: string): string[] {
	return css
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => /^--[\w-]+\s*:/.test(line));
}

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

	it("テーマ A → テーマ B → テーマ A で元の内容に戻る（可逆性）", () => {
		const blockA = ":root {\n  --surface-panel: rgba(21, 16, 10, 0.9);\n}";
		const blockB = ":root {\n  --surface-panel: #2a1c0e;\n}";
		const toB = replaceThemeBlock(base, blockB);
		const backToA = replaceThemeBlock(toB, blockA);
		expect(replaceThemeBlock(base, blockA)).toBe(backToA);
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

	it("listThemes が current / dark-taproom を返す（amber-dark は #449 で撤去済み）", () => {
		const themes = listThemes(themesDir);
		expect(themes).toContain("current");
		// Issue #440: current と同内容の Dark Taproom 復元用テーマ
		expect(themes).toContain("dark-taproom");
		// Issue #449: Dark Taproom 基盤化で無効化された壊れテーマは撤去済み
		expect(themes).not.toContain("amber-dark");
	});

	it("dark-taproom テーマの全トークンが current.css と完全一致する（片方だけ変更したらドリフト検出）", () => {
		const currentCss = readFileSync(join(themesDir, "current.css"), "utf8");
		const darkTaproomCss = readFileSync(
			join(themesDir, "dark-taproom.css"),
			"utf8",
		);
		// コメント文言は両ファイルで異なるため、:root 内の `--token: value;` 行だけを
		// 全件抽出して比較する。主要4トークンだけの部分検査だと残り約30トークンが片方だけ
		// 変更されても緑のまま通ってしまうため、全トークンの完全一致で守る。
		expect(extractDeclarations(currentCss)).toEqual(
			extractDeclarations(darkTaproomCss),
		);
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

	it("トップ限定スコープ .top-amber-dark は撤去されている（Issue #442）", () => {
		// Issue #442 でトップ/検索ページを Dark Taproom で再実装し、page-client.tsx の
		// .top-amber-dark ラッパを撤去した。:root 自体が Dark Taproom 化されているため、
		// トップの背景・文字色は AuthenticatedLayout（bg-background）と基盤トークンで足りる。
		expect(globalsCss).not.toContain(".top-amber-dark");
	});

	it("@theme inline に明朝・Archivo のフォント変数が登録されている", () => {
		// next/font で読み込む Zen Old Mincho / Archivo を任意要素へ適用できること
		expect(globalsCss).toContain("--font-mincho: var(--font-mincho);");
		expect(globalsCss).toContain("--font-archivo: var(--font-archivo);");
		expect(globalsCss).toContain("--font-sans: var(--font-gothic);");
	});
});
