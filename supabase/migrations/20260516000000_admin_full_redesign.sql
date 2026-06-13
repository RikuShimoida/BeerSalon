-- ============================================================
-- Phase 1: 管理画面全面改修 - 追加処理
-- Issue #172
-- 初期スキーマ（20241201000000_init_schema.sql）で作成済みの
-- テーブル構造に対する追加のみ実行
-- ============================================================

-- ============================================================
-- 1. 支払い方法マスタデータ
-- ============================================================

INSERT INTO payment_methods (name, display_order, is_active, created_at, updated_at)
VALUES
  ('現金', 0, true, now(), now()),
  ('クレジットカード', 1, true, now(), now()),
  ('電子マネー', 2, true, now(), now()),
  ('QRコード決済', 3, true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. 廃止テーブル DROP
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
