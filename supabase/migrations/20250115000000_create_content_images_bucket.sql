-- Create storage bucket for content images (home page sections)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for content images
CREATE POLICY "Allow public read access to content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Allow authenticated users to upload content images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update content images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete content images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
);
