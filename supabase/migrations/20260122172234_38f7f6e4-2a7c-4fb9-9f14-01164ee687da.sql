-- Fix: Update storage policies for diagnostic-images bucket
-- The upload policy already exists, so we only need to add view and delete policies

-- Create policy for viewing (SELECT) - only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can view diagnostic images' 
    AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can view diagnostic images" 
    ON storage.objects 
    FOR SELECT 
    TO authenticated
    USING (bucket_id = 'diagnostic-images');
  END IF;
END $$;

-- Create policy for deleting - only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can delete diagnostic images' 
    AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can delete diagnostic images" 
    ON storage.objects 
    FOR DELETE 
    TO authenticated
    USING (bucket_id = 'diagnostic-images');
  END IF;
END $$;