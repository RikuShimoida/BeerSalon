-- 店舗営業時間テーブルの作成
CREATE TABLE bar_opening_hours (
  id BIGSERIAL PRIMARY KEY,
  bar_id BIGINT NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_bar_opening_hours_bar_day ON bar_opening_hours(bar_id, day_of_week);

-- コメント追加
COMMENT ON TABLE bar_opening_hours IS '店舗の曜日別営業時間';
COMMENT ON COLUMN bar_opening_hours.day_of_week IS '曜日 (0=月, 1=火, 2=水, 3=木, 4=金, 5=土, 6=日)';
COMMENT ON COLUMN bar_opening_hours.is_closed IS '定休日フラグ';
COMMENT ON COLUMN bar_opening_hours.sort_order IS '同一曜日内の表示順';

-- 既存データの移行（opening_time と ending_time が設定されている店舗のみ）
INSERT INTO bar_opening_hours (bar_id, day_of_week, open_time, close_time, sort_order)
SELECT
  id,
  day,
  opening_time,
  ending_time,
  0
FROM bars
CROSS JOIN generate_series(0, 6) AS day
WHERE opening_time IS NOT NULL AND ending_time IS NOT NULL;
