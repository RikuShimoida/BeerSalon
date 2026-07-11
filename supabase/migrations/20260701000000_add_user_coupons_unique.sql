-- ============================================================
-- user_coupons テーブルに (user_id, coupon_id) の複合 UNIQUE 制約を追加
-- Issue #346 / PR #360 レビュー指摘（二重取得の race condition = TOCTOU 対策）
-- database.md セクション 3-2 に対応
--
-- 二重取得（取得ボタン連打）で同一 (user_id, coupon_id) が複数 INSERT されうる
-- TOCTOU を、DB の UNIQUE 制約で恒久的に防止する。アプリ側は P2002 を
-- 「既に取得済み」エラーとしてハンドリングする。
--
-- 前提: 既存データ（seed / E2E データ含む）に (user_id, coupon_id) の重複は無い。
--       重複が存在すると本 INDEX 作成は失敗する。
-- Prisma の @@unique([userId, couponId]) が生成するインデックス名に合わせる。
-- ============================================================

CREATE UNIQUE INDEX "user_coupons_user_id_coupon_id_key" ON "user_coupons"("user_id", "coupon_id");
