-- Add x_url and facebook_url columns to bars table
ALTER TABLE bars ADD COLUMN IF NOT EXISTS x_url TEXT;
ALTER TABLE bars ADD COLUMN IF NOT EXISTS facebook_url TEXT;
