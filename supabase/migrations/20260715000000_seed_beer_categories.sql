-- ============================================================
-- ビールカテゴリ初期マスタ投入
-- Issue #428
-- ============================================================
-- なぜマイグレーションで投入するか（Why not seed）:
--   beer_categories は従来 supabase/seed.e2e.sql（E2E ローカル専用）にしか
--   INSERT が無く、migrate.yml（supabase db push＝マイグレーションのみ適用）
--   では preview / production の remote DB に届かなかった。その結果、管理画面の
--   メニュー登録でビールカテゴリのプルダウンが空になり、必須項目のため登録できなかった。
--   payment_methods と同じくマイグレーション内 INSERT に一本化し、全環境へ届かせる。
--
-- カテゴリはユーザー画面の検索フォーム（apps/web の BEER_CATEGORIES）と語彙を揃える。
-- 検索側と登録側の語彙が一致しないと検索でヒットしないため。

INSERT INTO beer_categories (name)
VALUES
  ('IPA'),
  ('ピルスナー'),
  ('スタウト'),
  ('ヴァイツェン'),
  ('ペールエール')
ON CONFLICT (name) DO NOTHING;
