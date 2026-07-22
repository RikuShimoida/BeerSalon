-- ============================================================
-- Beer Salon - E2E Test Seed Data
-- ============================================================
-- 本番 seed (seed.sql) とは完全に分離されたE2E専用シード。
-- 固定ID・固定値でテストの再現性を担保する。
--
-- 使用するパスワード（bcryptハッシュ済み）:
--   - admin / bar_owner 両方 → 平文は GitHub Secrets `E2E_ADMIN_PASSWORD` で管理
--   - 開発時はローカルの .env.local / .env.e2e で渡す
--   - bcrypt cost=10 で生成。文字列は事前生成しコミット
-- ============================================================

-- ============================================================
-- 1. 固定 Bar (id=100001, 100002)
-- ============================================================

-- Why not: 100001 は緯度経度 NULL のまま残し、住所文字列フォールバックの地図導線を
-- E2E で検証できるようにする。100002 に座標を投入し、座標優先の地図導線を検証する。
INSERT INTO bars (id, name, prefecture, city, address_line1, description, latitude, longitude, is_active)
VALUES
  (100001, 'E2Eテストバー静岡', '静岡県', '静岡市', 'テスト住所1-1-1', 'E2Eテスト用のクラフトビアバーです', NULL, NULL, true),
  (100002, 'E2Eテストバー東京', '東京都', '渋谷区', 'テスト住所2-2-2', 'E2Eテスト用の東京のクラフトビアバー', 35.6595, 139.7005, true)
ON CONFLICT (id) DO NOTHING;

-- Why not: INSERT は ON CONFLICT DO NOTHING のため、既に投入済みのDBには座標が反映されない。
-- 地図導線の座標優先ケースを再現するため、固定バーの緯度経度を明示的に揃える。
UPDATE bars SET latitude = NULL, longitude = NULL WHERE id = 100001;
UPDATE bars SET latitude = 35.6595, longitude = 139.7005 WHERE id = 100002;

-- bars テーブルの sequence を 100002 以降に進めて、他のテストでの自動採番と衝突しないようにする
SELECT setval(
  pg_get_serial_sequence('bars', 'id'),
  GREATEST((SELECT MAX(id) FROM bars), 100002)
);

-- ============================================================
-- 2. Admin テストアカウント (bcrypt済)
-- ============================================================
-- 平文パスワード: TestPass1234! （E2E専用・本番では未使用）
-- bcrypt cost=10 で生成済み
INSERT INTO admin_users (bar_manage_id, password_hash, name, role, bar_id, is_active)
VALUES
  ('e2e-admin', '$2b$10$kbf156FnRTV6aiy8gH54x.gI.6gm0j0nJc6CLbQEuQWtHyACfrxU.', 'E2E システム管理者', 'admin', NULL, true)
ON CONFLICT (bar_manage_id) DO NOTHING;

INSERT INTO admin_users (bar_manage_id, password_hash, name, role, bar_id, is_active)
VALUES
  ('e2e-bar-owner', '$2b$10$kbf156FnRTV6aiy8gH54x.gI.6gm0j0nJc6CLbQEuQWtHyACfrxU.', 'E2E バーオーナー', 'bar_owner', 100001, true)
ON CONFLICT (bar_manage_id) DO NOTHING;

-- ============================================================
-- 3. 検索/詳細に最低限必要なマスタ
-- ============================================================

INSERT INTO countries (name) VALUES
  ('日本'),
  ('アメリカ'),
  ('ベルギー')
ON CONFLICT (name) DO NOTHING;

INSERT INTO regions (name, country_id)
SELECT r.name, c.id
FROM (VALUES ('静岡'), ('東京')) AS r(name)
CROSS JOIN countries c WHERE c.name = '日本'
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO beer_categories (name) VALUES
  ('IPA'),
  ('ピルスナー'),
  ('ペールエール')
ON CONFLICT (name) DO NOTHING;
