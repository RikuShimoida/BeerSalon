-- ============================================================
-- breweries テーブルに country_id カラムを追加
-- Issue #185
-- database.md セクション 2-6 で定義済みだがDBに未反映だった
-- ============================================================

ALTER TABLE "breweries" ADD COLUMN "country_id" BIGINT;

ALTER TABLE "breweries" ADD CONSTRAINT "breweries_country_id_fkey"
  FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_breweries_country_id" ON "breweries"("country_id");
