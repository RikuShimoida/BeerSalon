-- ============================================================
-- Phase 1: 管理画面全面改修 - スキーマ変更マイグレーション
-- Issue #172
-- ============================================================

-- ============================================================
-- 1. admin_users テーブルの改修
-- ============================================================

-- email → bar_manage_id へリネーム
ALTER TABLE admin_users RENAME COLUMN email TO bar_manage_id;

-- bar_id カラム追加（バーオーナーが管理するバーへの直接FK）
ALTER TABLE admin_users ADD COLUMN bar_id bigint REFERENCES bars(id) ON DELETE SET NULL;

-- contact_email カラム追加
ALTER TABLE admin_users ADD COLUMN contact_email text;

-- contact_phone カラム追加
ALTER TABLE admin_users ADD COLUMN contact_phone text;

-- ============================================================
-- 2. bar_beer_menu_sizes テーブル新設
-- ============================================================

CREATE TABLE bar_beer_menu_sizes (
  id bigserial PRIMARY KEY,
  bar_beer_menu_id bigint NOT NULL REFERENCES bar_beer_menus(id) ON DELETE CASCADE,
  size_name text NOT NULL,
  price integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. bar_beer_menus テーブル改修
--    既存の size/price データを bar_beer_menu_sizes に移行してから削除
-- ============================================================

-- 既存データの移行: size または price が設定されているレコードを移行
INSERT INTO bar_beer_menu_sizes (bar_beer_menu_id, size_name, price, sort_order)
SELECT id, COALESCE(size, 'レギュラー'), price, 0
FROM bar_beer_menus
WHERE size IS NOT NULL OR price IS NOT NULL;

-- size カラム削除
ALTER TABLE bar_beer_menus DROP COLUMN IF EXISTS size;

-- price カラム削除
ALTER TABLE bar_beer_menus DROP COLUMN IF EXISTS price;

-- ============================================================
-- 4. articles テーブル改修
-- ============================================================

-- image_url_2 追加
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url_2 text;

-- image_url_3 追加
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url_3 text;

-- deleted_at 追加（論理削除用）
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- status カラム追加
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- is_published が存在する場合: 既存データを status に移行
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'is_published'
  ) THEN
    UPDATE articles SET status = 'published' WHERE is_published = true;
    UPDATE articles SET status = 'draft' WHERE is_published = false;
    ALTER TABLE articles DROP COLUMN is_published;
  END IF;
END $$;

-- ============================================================
-- 5. coupons → bar_coupons 統一
-- ============================================================

-- テーブル名リネーム（coupons が存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coupons'
  ) THEN
    ALTER TABLE coupons RENAME TO bar_coupons;
  END IF;
END $$;

-- discount_type カラム追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bar_coupons' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE bar_coupons ADD COLUMN discount_type text NOT NULL DEFAULT 'percentage';
  END IF;
END $$;

-- discount_value カラム追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bar_coupons' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE bar_coupons ADD COLUMN discount_value numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- code カラム追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bar_coupons' AND column_name = 'code'
  ) THEN
    ALTER TABLE bar_coupons ADD COLUMN code text;
  END IF;
END $$;

-- usage_limit カラム追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bar_coupons' AND column_name = 'usage_limit'
  ) THEN
    ALTER TABLE bar_coupons ADD COLUMN usage_limit integer;
  END IF;
END $$;

-- used_count カラム追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bar_coupons' AND column_name = 'used_count'
  ) THEN
    ALTER TABLE bar_coupons ADD COLUMN used_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- conditions カラムがあれば削除
ALTER TABLE bar_coupons DROP COLUMN IF EXISTS conditions;

-- ============================================================
-- 6. 廃止テーブル DROP
-- ============================================================

-- bar_owners を参照する Storage ポリシーを先に削除
DROP POLICY IF EXISTS "Bar owners can upload own bar preview images" ON storage.objects;
DROP POLICY IF EXISTS "Bar owners can update own bar preview images" ON storage.objects;
DROP POLICY IF EXISTS "Bar owners can delete own bar preview images" ON storage.objects;

DROP TABLE IF EXISTS bar_owners CASCADE;
DROP TABLE IF EXISTS master_beer_styles CASCADE;
DROP TABLE IF EXISTS master_breweries CASCADE;
DROP TABLE IF EXISTS master_food_categories CASCADE;
DROP TABLE IF EXISTS master_event_categories CASCADE;
