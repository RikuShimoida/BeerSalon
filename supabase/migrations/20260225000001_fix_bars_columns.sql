-- Fix bars table columns to match the form structure
-- フォームの構造に合わせてbarsテーブルのカラムを修正

-- Step 1: 既存の address_line を address_line1 にリネーム
ALTER TABLE bars RENAME COLUMN address_line TO address_line1;

-- Step 2: address_line2 カラムを追加
ALTER TABLE bars
ADD COLUMN IF NOT EXISTS address_line2 TEXT;

-- Step 3: phone を phone_number にリネーム
ALTER TABLE bars RENAME COLUMN phone TO phone_number;

-- Step 4: instagram_url カラムを追加
ALTER TABLE bars
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Step 5: facebook_url カラムを追加（既に追加されている場合はスキップ）
ALTER TABLE bars
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- コメントを追加
COMMENT ON COLUMN bars.address_line1 IS '番地（必須）';
COMMENT ON COLUMN bars.address_line2 IS '建物名・部屋番号（任意）';
COMMENT ON COLUMN bars.phone_number IS '電話番号（任意）';
COMMENT ON COLUMN bars.instagram_url IS 'Instagram店舗アカウントURL（任意）';
COMMENT ON COLUMN bars.facebook_url IS 'Facebook店舗ページURL（任意）';
