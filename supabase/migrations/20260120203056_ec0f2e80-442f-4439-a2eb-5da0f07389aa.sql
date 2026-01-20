-- Create storage bucket for diagnostic images
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagnostic-images', 'diagnostic-images', true);

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload diagnostic images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'diagnostic-images');

-- Policy to allow public read access to diagnostic images
CREATE POLICY "Anyone can view diagnostic images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'diagnostic-images');

-- Policy to allow authenticated users to delete their images
CREATE POLICY "Authenticated users can delete diagnostic images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'diagnostic-images');