-- Make diagnostic-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'diagnostic-images';

-- Remove the public access policy
DROP POLICY IF EXISTS "Anyone can view diagnostic images" ON storage.objects;

-- Replace generic authenticated policies with workshop-scoped policies
DROP POLICY IF EXISTS "Authenticated users can view diagnostic images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload diagnostic images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete diagnostic images" ON storage.objects;

-- View: Allow workshop owners to view their service images
CREATE POLICY "Workshop owners can view their diagnostic images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'diagnostic-images' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT s.id FROM public.services s
    INNER JOIN public.workshops w ON s.workshop_id = w.id
    WHERE w.user_id = auth.uid()
  )
);

-- Upload: Allow workshop owners to upload to their services
CREATE POLICY "Workshop owners can upload diagnostic images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diagnostic-images'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT s.id FROM public.services s
    INNER JOIN public.workshops w ON s.workshop_id = w.id
    WHERE w.user_id = auth.uid()
  )
);

-- Delete: Allow workshop owners to delete their images
CREATE POLICY "Workshop owners can delete diagnostic images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'diagnostic-images'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT s.id FROM public.services s
    INNER JOIN public.workshops w ON s.workshop_id = w.id
    WHERE w.user_id = auth.uid()
  )
);