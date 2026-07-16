import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Issue #428: beer_categories はマイグレーションで投入しないと remote（preview/prod）へ
// 届かず、管理画面のメニュー登録でカテゴリが空になる。マイグレーションが「全環境へ届く
// 経路（migrate.yml の supabase db push 対象）」で、確定した初期カテゴリを冪等 INSERT
// していることを、SQL ファイル本文を読んで機械的に担保する。

// このテストの正となる初期カテゴリ。ユーザー画面の検索フォーム（apps/web の
// BEER_CATEGORIES）と語彙を揃える。検索側と登録側の語彙がズレるとヒットしないため、
// 将来どちらかを変えたらこの一覧との差分でテストが落ちて気づける。
const EXPECTED_CATEGORIES = [
	"IPA",
	"ピルスナー",
	"スタウト",
	"ヴァイツェン",
	"ペールエール",
];

const MIGRATION_PATH = resolve(
	__dirname,
	"../../../../supabase/migrations/20260715000000_seed_beer_categories.sql",
);

function readMigration(): string {
	return readFileSync(MIGRATION_PATH, "utf-8");
}

describe("beer_categories 初期マスタ投入マイグレーション（Issue #428）", () => {
	it("beer_categories テーブルへ INSERT している", () => {
		const sql = readMigration();
		expect(sql).toMatch(/INSERT\s+INTO\s+beer_categories/i);
	});

	it("ON CONFLICT (name) DO NOTHING で冪等に投入している", () => {
		const sql = readMigration();
		// 既に投入済みの環境（E2E seed 済みローカル等）でも再適用で失敗しないこと。
		expect(sql).toMatch(/ON\s+CONFLICT\s*\(\s*name\s*\)\s+DO\s+NOTHING/i);
	});

	it("確定した初期カテゴリをすべて投入している", () => {
		const sql = readMigration();
		for (const category of EXPECTED_CATEGORIES) {
			expect(sql).toContain(`('${category}')`);
		}
	});

	it("確定した以外のカテゴリを投入していない（VALUES 行数が一致する）", () => {
		const sql = readMigration();
		// INSERT ブロックの VALUES から '...' で囲まれた値だけを抜き出して件数を検証する。
		const insertBlock = sql
			.slice(sql.search(/INSERT\s+INTO\s+beer_categories/i))
			.split(/ON\s+CONFLICT/i)[0];
		const values = [...insertBlock.matchAll(/\('([^']+)'\)/g)].map((m) => m[1]);
		expect(values.sort()).toEqual([...EXPECTED_CATEGORIES].sort());
	});
});
