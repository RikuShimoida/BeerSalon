-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for post images
CREATE POLICY "Allow public read access to post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Allow authenticated users to upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
);
