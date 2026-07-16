import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Issue #432: countries / regions はマイグレーションで投入しないと remote（preview/prod）へ
// 届かず、管理画面のビールメニュー登録で国・産地のプルダウンが空になる（産地はユーザー画面の
// 検索フィルタとも連動する）。#428（beer_categories）と同型の欠陥。マイグレーションが「全環境へ
// 届く経路（migrate.yml の supabase db push 対象）」で、確定した初期マスタを冪等 INSERT
// していることを、SQL ファイル本文を読んで機械的に担保する。

// このテストの正となる初期マスタ。supabase/seed.sql の現行値を踏襲する。
// 将来 seed.sql とマイグレーションのどちらかを変えたらこの一覧との差分でテストが落ちて気づける。
const EXPECTED_COUNTRIES = [
	"アメリカ",
	"ベルギー",
	"ドイツ",
	"イギリス",
	"チェコ",
	"アイルランド",
	"日本",
	"オーストラリア",
	"ニュージーランド",
	"オランダ",
];

// 国名 → その国に投入する産地。regions INSERT が正しい国に紐付いていることを検証する。
const EXPECTED_REGIONS_BY_COUNTRY: Record<string, string[]> = {
	アメリカ: ["カリフォルニア", "オレゴン", "コロラド", "ワシントン"],
	ベルギー: ["フランダース", "ワロン", "ブリュッセル"],
	ドイツ: ["バイエルン", "ケルン", "ベルリン"],
	イギリス: ["ロンドン", "バートン・アポン・トレント", "エディンバラ"],
	チェコ: ["プルゼニ", "プラハ"],
	アイルランド: ["ダブリン", "コーク"],
	日本: ["静岡", "長野", "北海道", "東京", "大阪", "横浜"],
	オーストラリア: ["メルボルン", "シドニー"],
	ニュージーランド: ["ウェリントン", "オークランド"],
	オランダ: ["アムステルダム"],
};

const MIGRATION_PATH = resolve(
	__dirname,
	"../../../../supabase/migrations/20260716000000_seed_countries_regions.sql",
);

function readMigration(): string {
	return readFileSync(MIGRATION_PATH, "utf-8");
}

describe("countries / regions 初期マスタ投入マイグレーション（Issue #432）", () => {
	it("countries テーブルへ INSERT している", () => {
		const sql = readMigration();
		expect(sql).toMatch(/INSERT\s+INTO\s+countries/i);
	});

	it("regions テーブルへ INSERT している", () => {
		const sql = readMigration();
		expect(sql).toMatch(/INSERT\s+INTO\s+regions/i);
	});

	it("countries を ON CONFLICT (name) DO NOTHING で冪等に投入している", () => {
		const sql = readMigration();
		// 既に投入済みの環境（seed 済みローカル等）でも再適用で失敗しないこと。
		expect(sql).toMatch(/ON\s+CONFLICT\s*\(\s*name\s*\)\s+DO\s+NOTHING/i);
	});

	it("regions を ON CONFLICT (country_id, name) DO NOTHING で冪等に投入している", () => {
		const sql = readMigration();
		expect(sql).toMatch(
			/ON\s+CONFLICT\s*\(\s*country_id\s*,\s*name\s*\)\s+DO\s+NOTHING/i,
		);
	});

	it("確定した国をすべて投入している", () => {
		const sql = readMigration();
		for (const country of EXPECTED_COUNTRIES) {
			expect(sql).toContain(`('${country}')`);
		}
	});

	it("確定した以外の国を投入していない（countries の VALUES 行数が一致する）", () => {
		const sql = readMigration();
		// countries の INSERT ブロック（ON CONFLICT まで）から '...' で囲まれた値を抜き出す。
		const insertBlock = sql
			.slice(sql.search(/INSERT\s+INTO\s+countries/i))
			.split(/ON\s+CONFLICT/i)[0];
		const values = [...insertBlock.matchAll(/\('([^']+)'\)/g)].map((m) => m[1]);
		expect(values.sort()).toEqual([...EXPECTED_COUNTRIES].sort());
	});

	it("各国の産地を、正しい国に紐付けて投入している（CROSS JOIN の国名で判定）", () => {
		const sql = readMigration();
		for (const [country, regions] of Object.entries(
			EXPECTED_REGIONS_BY_COUNTRY,
		)) {
			// regions は「INSERT ... CROSS JOIN countries c WHERE c.name = '<国名>' ... ON CONFLICT」
			// のブロック単位で国ごとに分かれている。国名で該当ブロックを切り出し、
			// そのブロック内に期待する産地がすべて含まれることを検証する。
			const marker = `WHERE c.name = '${country}'`;
			const markerIndex = sql.indexOf(marker);
			expect(
				markerIndex,
				`${country} の regions INSERT が見つからない`,
			).toBeGreaterThan(-1);
			// このブロックは marker の直前の VALUES から次の ON CONFLICT までが対象。
			// marker より前の直近 VALUES ~ marker 以降最初の ON CONFLICT を1ブロックとして切る。
			const blockStart = sql.lastIndexOf("VALUES", markerIndex);
			const blockEnd = sql.indexOf("ON CONFLICT", markerIndex);
			const block = sql.slice(blockStart, blockEnd);
			for (const region of regions) {
				expect(
					block,
					`${country} のブロックに産地「${region}」が含まれていない`,
				).toContain(`('${region}')`);
			}
		}
	});
});
