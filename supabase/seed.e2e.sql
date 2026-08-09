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

-- ============================================================
-- 4. 店舗詳細ヒーロー用スライダーメディア (bar 100002)
-- ============================================================
-- 動画1件 + 画像2件を投入し、ヒーローのオートスライド/フェード/ループ/
-- 動画自動再生 (#485) を E2E で検証できるようにする。
-- 動画/画像の実体が Storage に無くても、DOM 上のスライダー挙動
-- (opacity 切替・index 遷移・ドット操作) は検証可能。
-- Why not: bar 100001 は admin の menu-image-slider-regression (#318) が
--   「slider 未投入・alt を持つ画像カードのみを削除して0枚化」する前提で使うため、
--   alt を持たない video を 100001 に入れると削除ロジックが動画を消せず 100001 が
--   0枚にならず衝突する。web #485 のスライダー検証は別の固定バー 100002 に載せる。
-- Why not: 単純な INSERT だと、ローカル開発 DB に残る既存 slider 画像と混在して
--   枚数が固定にならず E2E が非決定的になる。100002 の slider を一度掃除してから
--   固定 3 件を投入し、CI/ローカルで同じ枚数を保証する。
DELETE FROM bar_images WHERE bar_id = 100002 AND image_type = 'slider';

INSERT INTO bar_images (id, bar_id, media_type, image_type, image_url, sort_order)
VALUES
  (100002001, 100002, 'video', 'slider', 'http://127.0.0.1:54421/storage/v1/object/public/bar-media/bars/100002/e2e_slider_video.mp4', 0),
  (100002002, 100002, 'image', 'slider', 'https://placehold.co/800x600/png?text=slider-1', 1),
  (100002003, 100002, 'image', 'slider', 'https://placehold.co/800x600/png?text=slider-2', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('bar_images', 'id'),
  GREATEST((SELECT MAX(id) FROM bar_images), 100002003)
);

-- ============================================================
-- Subscription Plans（課金開始フロー #335 の E2E 用・固定ID）
-- ============================================================
-- Why not: checkout API は is_active な subscription_plans を1件引いて Checkout の
--   line_items に stripe_price_id を渡すため、E2E でも active プランが1件必要。実 Price ID は
--   未確定のため placeholder を入れる（Checkout 遷移までを E2E の受入とする方針）。
INSERT INTO subscription_plans (id, name, stripe_price_id, price, currency, interval, is_active)
VALUES (100001, '店舗月額プラン', 'price_placeholder_5000_monthly', 5000, 'jpy', 'month', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('subscription_plans', 'id'),
  GREATEST((SELECT MAX(id) FROM subscription_plans), 100001)
);

-- ============================================================
-- Dashboard 集計データ（bar_owner 分析ダッシュボード #348 の E2E 用・固定ID）
-- ============================================================
-- Why not: auth.users への FK は user_profiles に無い（init_schema 参照）ため、E2E では
--   固定 UUID の user_profiles を直接投入する。auth 経由のサインアップは集計データ準備には過剰。
-- 期待集計（bar 100001 = e2e-bar-owner の店）:
--   閲覧数=2 / お気に入り=1 / 記事いいね=3 / タグ付け投稿=2
-- bar 100002 側にも各1件入れ、100001 の集計に他店データが混入しないことを E2E で検証する。
INSERT INTO user_profiles (id, user_auth_id, last_name, first_name, nickname, birthday, gender, prefecture, is_active)
VALUES
  ('00000000-0000-0000-0000-0000000da001', '00000000-0000-0000-0000-0000000da0a1', 'ダッシュ', '太郎', 'dash-a', '1990-01-01', 'male', '静岡県', true),
  ('00000000-0000-0000-0000-0000000da002', '00000000-0000-0000-0000-0000000da0a2', 'ダッシュ', '花子', 'dash-b', '1991-02-02', 'female', '静岡県', true),
  ('00000000-0000-0000-0000-0000000da003', '00000000-0000-0000-0000-0000000da0a3', 'ダッシュ', '次郎', 'dash-c', '1992-03-03', 'male', '静岡県', true)
ON CONFLICT (id) DO NOTHING;

-- 記事: 100001 に2件（公開）、100002 に1件
INSERT INTO articles (id, bar_id, title, body, status, published_at)
VALUES
  (100001001, 100001, 'E2E記事A(100001)', '本文A', 'published', CURRENT_TIMESTAMP),
  (100001002, 100001, 'E2E記事B(100001)', '本文B', 'published', CURRENT_TIMESTAMP),
  (100002001, 100002, 'E2E記事C(100002)', '本文C', 'published', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('articles', 'id'),
  GREATEST((SELECT MAX(id) FROM articles), 100002001)
);

-- クーポン/イベント: JST 08:00（= UTC 前日 23:00）固定。
-- timeZone 指定が漏れると UTC 環境で日付が1日巻き戻るため、TZ ずれを検出できる境界値として使う。
-- CURRENT_TIMESTAMP を使わないのは、実行時刻によっては境界をまたがず検証にならないため。
INSERT INTO bar_coupons (id, bar_id, title, description, discount_type, discount_value, valid_from, valid_until, is_active)
VALUES
  (100001101, 100001, 'E2E JST境界クーポン', 'JST早朝の日付表示検証用', 'fixed_amount', 500,
   TIMESTAMPTZ '2026-09-02 08:00:00+09', TIMESTAMPTZ '2026-12-02 08:00:00+09', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('bar_coupons', 'id'),
  GREATEST((SELECT MAX(id) FROM bar_coupons), 100001101)
);

INSERT INTO bar_events (id, bar_id, title, description, start_date, end_date, is_active)
VALUES
  (100001201, 100001, 'E2E JST境界イベント', 'JST早朝の日時表示検証用',
   TIMESTAMPTZ '2026-09-02 08:00:00+09', TIMESTAMPTZ '2026-09-02 20:00:00+09', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('bar_events', 'id'),
  GREATEST((SELECT MAX(id) FROM bar_events), 100001201)
);

-- 閲覧履歴: 100001 を 2ユーザー閲覧（=2）、100002 を 1ユーザー閲覧（混入しないこと）
INSERT INTO view_histories (user_id, bar_id)
VALUES
  ('00000000-0000-0000-0000-0000000da001', 100001),
  ('00000000-0000-0000-0000-0000000da002', 100001),
  ('00000000-0000-0000-0000-0000000da003', 100002)
ON CONFLICT (user_id, bar_id) DO NOTHING;

-- お気に入り: 100001 を 1ユーザー（=1）、100002 を 1ユーザー
INSERT INTO favorite_bars (user_id, bar_id)
VALUES
  ('00000000-0000-0000-0000-0000000da001', 100001),
  ('00000000-0000-0000-0000-0000000da003', 100002)
ON CONFLICT (user_id, bar_id) DO NOTHING;

-- 記事いいね: 100001 の記事に 3件（=3）、100002 の記事に 1件
INSERT INTO article_likes (article_id, user_id)
VALUES
  (100001001, '00000000-0000-0000-0000-0000000da001'),
  (100001001, '00000000-0000-0000-0000-0000000da002'),
  (100001002, '00000000-0000-0000-0000-0000000da003'),
  (100002001, '00000000-0000-0000-0000-0000000da001')
ON CONFLICT (article_id, user_id) DO NOTHING;

-- タグ付け投稿: 100001 に 2件（=2）、100002 に 1件
INSERT INTO posts (id, user_id, bar_id, body)
VALUES
  (100001101, '00000000-0000-0000-0000-0000000da001', 100001, 'E2E投稿A(100001)'),
  (100001102, '00000000-0000-0000-0000-0000000da002', 100001, 'E2E投稿B(100001)'),
  (100002101, '00000000-0000-0000-0000-0000000da003', 100002, 'E2E投稿C(100002)')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('posts', 'id'),
  GREATEST((SELECT MAX(id) FROM posts), 100002101)
);
