-- ============================================================
-- bar_events テーブル作成
-- Issue #179: イベント管理機能のテーブルが未作成だったため追加
-- ============================================================

CREATE TABLE IF NOT EXISTS bar_events (
  id bigserial PRIMARY KEY,
  bar_id bigint NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bar_events_bar_id ON bar_events(bar_id);
