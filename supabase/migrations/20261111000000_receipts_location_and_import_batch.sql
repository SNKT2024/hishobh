-- Migration: Add import_batch_id, receipt_url, and location fields to transactions
-- Also provisions the Supabase Storage 'receipts' bucket with RLS policies

-- 1. Ensure columns exist on transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_batch_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch_id ON public.transactions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_location_name ON public.transactions(location_name) WHERE location_name IS NOT NULL;

-- 3. Create public receipts storage bucket in Supabase Storage if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- 4. Storage Policies for 'receipts' bucket
DROP POLICY IF EXISTS "Public can view receipt images" ON storage.objects;
CREATE POLICY "Public can view receipt images"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Authenticated users can upload receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipt images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Authenticated users can update their receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can update their receipt images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Authenticated users can delete receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can delete receipt images"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts');

