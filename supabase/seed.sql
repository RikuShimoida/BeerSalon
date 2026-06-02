-- ============================================================
-- Beer Salon - Seed Data
-- ============================================================

-- Admin テストアカウント
-- password: admin1234
INSERT INTO admin_users (bar_manage_id, password_hash, name, role, bar_id, is_active)
VALUES ('admin', '$2b$10$wzjVvOFTvvCdDshrCpiICu/6LCLmrZWNZ8r10UgiO58LFvzivMgBu', 'システム管理者', 'admin', NULL, true)
ON CONFLICT (bar_manage_id) DO NOTHING;

-- Bar Owner テストアカウント（ビアバー御殿場）
-- password: admin1234
INSERT INTO admin_users (bar_manage_id, password_hash, name, role, bar_id, is_active)
VALUES ('fuji-beer-bar', '$2b$10$wzjVvOFTvvCdDshrCpiICu/6LCLmrZWNZ8r10UgiO58LFvzivMgBu', 'ビアバー御殿場オーナー', 'bar_owner', 5, true)
ON CONFLICT (bar_manage_id) DO NOTHING;

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
