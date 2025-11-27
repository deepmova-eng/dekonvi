-- Migration: Add images support to messages
-- Created: 2025-01-27
-- Description: Add images column to messages table and setup Supabase Storage

-- 1. Add images column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 2. Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for message images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own message images" ON storage.objects;

-- 4. Storage policies for public read access
CREATE POLICY "Public read access for message images"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-images');

-- 5. Storage policy for authenticated upload
CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-images' 
  AND auth.uid() IS NOT NULL
);

-- 6. Storage policy for users to delete their own uploads
CREATE POLICY "Users can delete their own message images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-images'
  AND auth.uid() IS NOT NULL
);
