-- Add instagram_url column to bars table
ALTER TABLE bars
ADD COLUMN instagram_url text;

COMMENT ON COLUMN bars.instagram_url IS 'Instagram URL';
