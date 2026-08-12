#!/usr/bin/env node
/**
 * 未使用 API エンドポイント検出スクリプト。
 *
 * apps/web / apps/admin の `route.ts` を列挙して URL パスを導出し、
 * その URL がソース中に fetch 等の呼び出しとして現れるかを grep で照合する。
 * 呼び出し元がゼロのルートを「未使用候補」として一覧化する。
 *
 * 使い方:
 *   node scripts/find-unused-api.mjs            # 人が読む形式で出力
 *   node scripts/find-unused-api.mjs --json     # JSON 形式で出力
 *   node scripts/find-unused-api.mjs --strict   # 未使用候補が 1 件でもあれば終了コード 1
 *
 * このスクリプトは削除を行わない。あくまで棚卸しの候補一覧を提示するだけで、
 * 実際に消すかどうかは人間が判断する（動的 URL の誤検出があり得るため安全側に倒す）。
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	collectTrailingVariablePrefixMatchers,
	deriveUrlPath,
	EXTERNAL_ENTRYPOINT_ALLOWLIST,
	isHeldByTrailingVariable,
	isReferenced,
} from "./find-unused-api.lib.mjs";

const REPO_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

// 検出対象アプリ（app ルートを持つワークスペース）
const APP_DIRS = ["apps/web/src/app", "apps/admin/src/app"];

// 呼び出しソースを探索する対象ディレクトリ（ビルド生成物・依存は除外）
const CALLSITE_DIRS = ["apps/web/src", "apps/admin/src"];

/**
 * git 管理下のファイルから条件に合うパスを列挙する。
 * git ls-files を使うことで .next / node_modules 等の未追跡・無視ファイルを自然に除外する。
 *
 * @param {string} dir リポジトリルート相対のディレクトリ
 * @param {string} pattern glob パターン
 * @returns {string[]} リポジトリルート相対の POSIX パス配列
 */
function gitListFiles(dir, pattern) {
	try {
		const out = execFileSync("git", ["ls-files", `${dir}/${pattern}`], {
			cwd: REPO_ROOT,
			encoding: "utf8",
		});
		return out.split("\n").filter((line) => line.length > 0);
	} catch {
		return [];
	}
}

/**
 * 呼び出しソース候補となる行を収集する。
 * fetch 呼び出しに限定せず、URL 文字列を含み得る行を広めに集めて誤検出（未使用の見逃し）を避ける。
 *
 * @returns {string[]} `/api` または `/auth` を含むソース行の配列
 */
function collectCallSites() {
	const lines = [];
	for (const dir of CALLSITE_DIRS) {
		for (const pattern of ["*.ts", "*.tsx"]) {
			const files = gitListFiles(dir, `**/${pattern}`);
			for (const file of files) {
				// route.ts 自身は定義側なので呼び出し元から除外する（自己参照を防ぐ）
				if (/\/route\.tsx?$/.test(file)) {
					continue;
				}
				try {
					const content = execFileSync("git", ["show", `:${file}`], {
						cwd: REPO_ROOT,
						encoding: "utf8",
					});
					for (const line of content.split("\n")) {
						if (line.includes("/api") || line.includes("/auth")) {
							lines.push(line);
						}
					}
				} catch {
					// 追跡直後などで git show 不可のときはワークツリー読み取りにフォールバックしない（追跡済み前提）
				}
			}
		}
	}
	return lines;
}

/**
 * すべての route.ts を列挙し、URL パス・アプリ名を導出する。
 * @returns {{ file: string, urlPath: string, app: string }[]}
 */
function collectRoutes() {
	const routes = [];
	for (const dir of APP_DIRS) {
		const files = gitListFiles(dir, "**/route.ts");
		for (const file of files) {
			const urlPath = deriveUrlPath(file);
			if (urlPath === null) {
				continue;
			}
			const app = file.startsWith("apps/web/") ? "web" : "admin";
			routes.push({ file, urlPath, app });
		}
	}
	return routes;
}

function main() {
	const args = process.argv.slice(2);
	const asJson = args.includes("--json");
	const strict = args.includes("--strict");

	const routes = collectRoutes();
	const callSites = collectCallSites();

	// 末尾が実行時変数の動的呼び出し（例: /api/bars/${barId}/${endpoint}）のプレフィックス群。
	// これらの配下 1 階層のルートは末尾値を静的に確定できないため「判定保留」に回す。
	const trailingVariableMatchers =
		collectTrailingVariablePrefixMatchers(callSites);

	const unused = [];
	const held = [];
	const allowlisted = [];

	for (const route of routes) {
		if (EXTERNAL_ENTRYPOINT_ALLOWLIST.includes(route.urlPath)) {
			allowlisted.push(route);
			continue;
		}

		if (isReferenced(route.urlPath, callSites)) {
			continue;
		}

		// 末尾変数呼び出しのプレフィックス配下に該当するルートのみ保留にする（対象を最小化）。
		if (isHeldByTrailingVariable(route.urlPath, trailingVariableMatchers)) {
			held.push(route);
		} else {
			unused.push(route);
		}
	}

	if (asJson) {
		process.stdout.write(
			`${JSON.stringify(
				{
					summary: {
						totalRoutes: routes.length,
						unused: unused.length,
						held: held.length,
						allowlisted: allowlisted.length,
					},
					unused,
					held,
					allowlisted,
				},
				null,
				2,
			)}\n`,
		);
	} else {
		printHuman({ routes, unused, held, allowlisted });
	}

	// strict モードでは未使用候補が 1 件でもあれば失敗扱い（将来の CI 化に向けた足場）。
	// 保留（held）は誤検出を含み得るため strict の失敗条件には含めない。
	if (strict && unused.length > 0) {
		process.exit(1);
	}
}

/**
 * @param {{ routes: object[], unused: object[], held: object[], allowlisted: object[] }} result
 */
function printHuman({ routes, unused, held, allowlisted }) {
	const out = [];
	out.push("=== 未使用 API 検出結果 ===");
	out.push(`対象ルート総数: ${routes.length}`);
	out.push(
		`未使用候補: ${unused.length} / 判定保留: ${held.length} / 除外(allowlist): ${allowlisted.length}`,
	);
	out.push("");

	if (unused.length > 0) {
		out.push("--- 未使用候補（呼び出し元ゼロ。目視確認のうえ削除を検討）---");
		for (const r of unused) {
			out.push(`  [${r.app}] ${r.urlPath}  (${r.file})`);
		}
		out.push("");
	}

	if (held.length > 0) {
		out.push(
			"--- 判定保留（末尾が実行時変数の動的呼び出しがあり静的解決不能。要目視）---",
		);
		out.push(
			"    ※ 型情報（union literal 等）を見ないため、実際には呼ばれない真の未使用がここに含まれ得る。目視で確認すること。",
		);
		for (const r of held) {
			out.push(`  [${r.app}] ${r.urlPath}  (${r.file})`);
		}
		out.push("");
	}

	if (allowlisted.length > 0) {
		out.push("--- 除外（外部から叩かれる正当なエンドポイント）---");
		for (const r of allowlisted) {
			out.push(`  [${r.app}] ${r.urlPath}  (${r.file})`);
		}
		out.push("");
	}

	if (unused.length === 0) {
		out.push("未使用候補はありません。");
	}

	process.stdout.write(`${out.join("\n")}\n`);
}

main();
