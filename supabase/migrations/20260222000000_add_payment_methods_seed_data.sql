-- 支払い方法マスタデータの追加
-- BeerSalonAdmin Issue #28: 支払い方法マスタデータの登録

-- 支払い方法マスタデータを追加
INSERT INTO payment_methods (name, display_order, is_active, created_at, updated_at)
VALUES
  ('現金', 0, true, now(), now()),
  ('クレジットカード', 1, true, now(), now()),
  ('電子マネー', 2, true, now(), now()),
  ('QRコード決済', 3, true, now(), now())
ON CONFLICT (name) DO NOTHING;
