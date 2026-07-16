-- ============================================================
-- 国・産地 初期マスタ投入（countries / regions）
-- Issue #432
-- ============================================================
-- なぜマイグレーションで投入するか（Why not seed）:
--   countries / regions は従来 supabase/seed.sql（ローカル専用シード）にしか
--   INSERT が無く、migrate.yml（supabase db push＝マイグレーションのみ適用）
--   では preview / production の remote DB に届かなかった。その結果、管理画面の
--   ビールメニュー登録で国・産地のプルダウンが空になり、選択できなかった。
--   産地はユーザー画面の検索フィルタ（getBeerRegions）とも連動するため、remote で
--   産地が空だと検索側にも波及する。#428（beer_categories）と同型の欠陥のため、
--   同じくマイグレーション内 INSERT に一本化して全環境へ届かせる。
--
-- 投入内容は supabase/seed.sql の現行値を踏襲する。ON CONFLICT で冪等なため、
-- seed 済みローカル（seed.sql / seed.e2e.sql）へ再適用しても衝突しない。
-- country_id はハードコードせず、CROSS JOIN countries c WHERE c.name = '<国名>' で
-- 動的解決する（先行する countries INSERT の結果を参照できる）。

-- ============================================================
-- Countries (主要ビール産地国)
-- ============================================================

INSERT INTO countries (name) VALUES
  ('アメリカ'),
  ('ベルギー'),
  ('ドイツ'),
  ('イギリス'),
  ('チェコ'),
  ('アイルランド'),
  ('日本'),
  ('オーストラリア'),
  ('ニュージーランド'),
  ('オランダ')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Regions (各国の代表的ビール産地)
-- ============================================================

-- アメリカ
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('カリフォルニア'), ('オレゴン'), ('コロラド'), ('ワシントン')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'アメリカ'
ON CONFLICT (country_id, name) DO NOTHING;

-- ベルギー
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('フランダース'), ('ワロン'), ('ブリュッセル')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'ベルギー'
ON CONFLICT (country_id, name) DO NOTHING;

-- ドイツ
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('バイエルン'), ('ケルン'), ('ベルリン')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'ドイツ'
ON CONFLICT (country_id, name) DO NOTHING;

-- イギリス
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('ロンドン'), ('バートン・アポン・トレント'), ('エディンバラ')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'イギリス'
ON CONFLICT (country_id, name) DO NOTHING;

-- チェコ
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('プルゼニ'), ('プラハ')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'チェコ'
ON CONFLICT (country_id, name) DO NOTHING;

-- アイルランド
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('ダブリン'), ('コーク')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'アイルランド'
ON CONFLICT (country_id, name) DO NOTHING;

-- 日本
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('静岡'), ('長野'), ('北海道'), ('東京'), ('大阪'), ('横浜')) AS r(name)
CROSS JOIN countries c WHERE c.name = '日本'
ON CONFLICT (country_id, name) DO NOTHING;

-- オーストラリア
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('メルボルン'), ('シドニー')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'オーストラリア'
ON CONFLICT (country_id, name) DO NOTHING;

-- ニュージーランド
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('ウェリントン'), ('オークランド')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'ニュージーランド'
ON CONFLICT (country_id, name) DO NOTHING;

-- オランダ
INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('アムステルダム')) AS r(name)
CROSS JOIN countries c WHERE c.name = 'オランダ'
ON CONFLICT (country_id, name) DO NOTHING;
