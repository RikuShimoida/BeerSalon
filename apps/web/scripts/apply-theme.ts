import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THEME_START = "/* THEME:START";
const THEME_END = "/* THEME:END */";

/**
 * globals.css の THEME:START 〜 THEME:END の間（開始マーカー行の直後〜終了マーカー行の直前）を
 * 指定テーマの `:root { ... }` ブロックへ差し替える。
 * マーカー行自体は残す（次回以降の差し替え対象を維持するため）。
 */
export function replaceThemeBlock(
	globalsCss: string,
	themeRootBlock: string,
): string {
	const startLineIdx = globalsCss.indexOf(THEME_START);
	if (startLineIdx === -1) {
		throw new Error(
			`globals.css に開始マーカー "${THEME_START}" が見つかりません。`,
		);
	}
	// 開始マーカーはコメント行なので、その行末（改行）までを前置きとして保持する
	const startLineEnd = globalsCss.indexOf("\n", startLineIdx);
	if (startLineEnd === -1) {
		throw new Error("開始マーカー行の改行が見つかりません。");
	}

	const endIdx = globalsCss.indexOf(THEME_END, startLineEnd);
	if (endIdx === -1) {
		throw new Error(
			`globals.css に終了マーカー "${THEME_END}" が見つかりません。`,
		);
	}

	const head = globalsCss.slice(0, startLineEnd + 1);
	const tail = globalsCss.slice(endIdx);
	const block = `${themeRootBlock.trimEnd()}\n`;
	return `${head}${block}${tail}`;
}

/**
 * テーマ CSS（`:root { ... }` を含む）から `:root { ... }` ブロックだけを抜き出す。
 * テーマファイルにコメント等の付随行があっても、差し替えるのは :root ブロックに限定する。
 */
export function extractRootBlock(themeCss: string): string {
	const rootIdx = themeCss.indexOf(":root");
	if (rootIdx === -1) {
		throw new Error("テーマ CSS に :root ブロックが見つかりません。");
	}
	const openBrace = themeCss.indexOf("{", rootIdx);
	if (openBrace === -1) {
		throw new Error("テーマ CSS の :root に { が見つかりません。");
	}
	// ネストしない前提（:root 直下のフラットな宣言のみ）で対応する } を探す
	const closeBrace = themeCss.indexOf("}", openBrace);
	if (closeBrace === -1) {
		throw new Error("テーマ CSS の :root に } が見つかりません。");
	}
	return themeCss.slice(rootIdx, closeBrace + 1);
}

function resolveDirs() {
	const scriptDir = dirname(fileURLToPath(import.meta.url));
	const webRoot = join(scriptDir, "..");
	return {
		themesDir: join(webRoot, "src", "styles", "themes"),
		globalsPath: join(webRoot, "src", "app", "globals.css"),
	};
}

export function listThemes(themesDir: string): string[] {
	return readdirSync(themesDir)
		.filter((f) => f.endsWith(".css"))
		.map((f) => f.replace(/\.css$/, ""))
		.sort();
}

function main() {
	const themeName = process.argv[2];
	const { themesDir, globalsPath } = resolveDirs();
	const available = listThemes(themesDir);

	if (!themeName) {
		console.error(
			`テーマ名を指定してください。\n利用可能なテーマ: ${available.join(", ")}\n例: pnpm --filter @beersalon/web theme current`,
		);
		process.exit(1);
	}

	if (!available.includes(themeName)) {
		console.error(
			`テーマ "${themeName}" は存在しません。\n利用可能なテーマ: ${available.join(", ")}`,
		);
		process.exit(1);
	}

	const themeCss = readFileSync(join(themesDir, `${themeName}.css`), "utf8");
	const rootBlock = extractRootBlock(themeCss);
	const globalsCss = readFileSync(globalsPath, "utf8");
	const next = replaceThemeBlock(globalsCss, rootBlock);
	writeFileSync(globalsPath, next);

	console.log(
		`テーマ "${themeName}" を globals.css に適用しました。pnpm dev で反映されます。`,
	);
}

// Why not import 時に副作用を走らせない: UT から純関数のみを import できるよう、
// 直接実行時（このファイルがエントリポイント）だけ main() を呼ぶ。
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
