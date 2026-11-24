import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SEED_PATHS = [
	resolve(__dirname, "../../../../supabase/seed.sql"),
	resolve(__dirname, "../../../../apps/admin/supabase/seed.sql"),
];

const PLAINTEXT_PASSWORD_COMMENT = /--.*(password|パスワード)\s*[:：=]/i;

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function findPlaintextPasswordComments(sql: string): string[] {
	return sql
		.split("\n")
		.filter((line) => PLAINTEXT_PASSWORD_COMMENT.test(line));
}

function extractAdminUserHashes(sql: string): Map<string, string> {
	const hashes = new Map<string, string>();
	const pattern = /(?:VALUES\s*\(|SELECT\s+)'([^']+)',\s*'([^']+)'/gi;
	for (const statement of sql.split(/;\s*\n/)) {
		if (!/INSERT\s+INTO\s+admin_users/i.test(statement)) continue;
		for (const match of statement.matchAll(pattern)) {
			hashes.set(match[1], match[2]);
		}
	}
	return hashes;
}

describe("findPlaintextPasswordComments", () => {
	it("「password: 値」形式のコメントを検出する", () => {
		expect(
			findPlaintextPasswordComments("-- password: secret\nSELECT 1;"),
		).toEqual(["-- password: secret"]);
	});

	it("括弧内・全角コロン・日本語表記のコメントも検出する", () => {
		const sql = [
			"-- Admin アカウント（password: secret）",
			"-- パスワード：secret",
			"-- PASSWORD=secret",
		].join("\n");
		expect(findPlaintextPasswordComments(sql)).toHaveLength(3);
	});

	it("値を書かずに管理場所だけを示すコメントは検出しない", () => {
		const sql =
			"-- Admin アカウント（平文のパスワードは git 管理外の email-pass.txt で管理）";
		expect(findPlaintextPasswordComments(sql)).toEqual([]);
	});

	it("コメントでない password_hash カラム名は検出しない", () => {
		const sql =
			"INSERT INTO admin_users (bar_manage_id, password_hash) VALUES ('a', 'b');";
		expect(findPlaintextPasswordComments(sql)).toEqual([]);
	});
});

describe("extractAdminUserHashes", () => {
	it("VALUES 形式と SELECT 形式の両方から bar_manage_id とハッシュを取り出す", () => {
		const sql = [
			"INSERT INTO admin_users (bar_manage_id, password_hash, name)",
			"VALUES ('admin', 'hash-a', 'x')",
			"ON CONFLICT (bar_manage_id) DO NOTHING;",
			"INSERT INTO bars (name) VALUES ('bar', 'not-a-hash');",
			"INSERT INTO admin_users (bar_manage_id, password_hash, name)",
			"SELECT 'owner', 'hash-b', 'y' FROM bars b;",
		].join("\n");
		expect(extractAdminUserHashes(sql)).toEqual(
			new Map([
				["admin", "hash-a"],
				["owner", "hash-b"],
			]),
		);
	});
});

describe.each(SEED_PATHS)("管理画面アカウントの seed（%s）", (path) => {
	const sql = readFileSync(path, "utf-8");
	const hashes = extractAdminUserHashes(sql);

	it("平文のパスワードをコメントに書いていない", () => {
		expect(findPlaintextPasswordComments(sql)).toEqual([]);
	});

	it("admin_users のアカウントを1件以上含み、すべて bcrypt ハッシュである", () => {
		expect(hashes.size).toBeGreaterThan(0);
		for (const hash of hashes.values()) {
			expect(hash).toMatch(BCRYPT_HASH);
		}
	});

	it("権限の違うアカウント同士でパスワードを使い回していない", () => {
		const values = [...hashes.values()];
		expect(new Set(values).size).toBe(values.length);
	});
});
