-- Supabase Storage バケット 'bar-preview-images' の作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bar-preview-images',
  'bar-preview-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ポリシー: 誰でも画像を参照可能（public bucket）
DROP POLICY IF EXISTS "Public read access for bar preview images" ON storage.objects;
CREATE POLICY "Public read access for bar preview images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bar-preview-images');

-- ポリシー: バーオーナーは自分のバーの画像のみアップロード可能
DROP POLICY IF EXISTS "Bar owners can upload own bar preview images" ON storage.objects;
CREATE POLICY "Bar owners can upload own bar preview images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bar-preview-images'
    AND (storage.foldername(name))[1] = 'bars'
    AND (
      -- バーオーナーは自分のバーのみアップロード可能
      EXISTS (
        SELECT 1 FROM bar_owners
        WHERE bar_id::text = (storage.foldername(name))[2]
          AND admin_user_id = auth.uid()::uuid
      )
      OR
      -- 管理者は全バーの画像をアップロード可能
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()::uuid AND role = 'admin'
      )
    )
  );

-- ポリシー: バーオーナーは自分のバーの画像のみ更新可能
DROP POLICY IF EXISTS "Bar owners can update own bar preview images" ON storage.objects;
CREATE POLICY "Bar owners can update own bar preview images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'bar-preview-images'
    AND (storage.foldername(name))[1] = 'bars'
    AND (
      EXISTS (
        SELECT 1 FROM bar_owners
        WHERE bar_id::text = (storage.foldername(name))[2]
          AND admin_user_id = auth.uid()::uuid
      )
      OR
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()::uuid AND role = 'admin'
      )
    )
  );

-- ポリシー: バーオーナーは自分のバーの画像のみ削除可能
DROP POLICY IF EXISTS "Bar owners can delete own bar preview images" ON storage.objects;
CREATE POLICY "Bar owners can delete own bar preview images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'bar-preview-images'
    AND (storage.foldername(name))[1] = 'bars'
    AND (
      EXISTS (
        SELECT 1 FROM bar_owners
        WHERE bar_id::text = (storage.foldername(name))[2]
          AND admin_user_id = auth.uid()::uuid
      )
      OR
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()::uuid AND role = 'admin'
      )
    )
  );
