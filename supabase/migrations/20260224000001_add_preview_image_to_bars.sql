-- barsテーブルにpreview_image_urlカラムを追加
ALTER TABLE bars
ADD COLUMN preview_image_url TEXT;

-- コメント追加
COMMENT ON COLUMN bars.preview_image_url IS '店舗一覧用のプレビュー画像URL（Supabase Storage）';
