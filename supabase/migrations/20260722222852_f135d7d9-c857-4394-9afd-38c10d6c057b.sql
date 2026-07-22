CREATE POLICY "Anon read showcase files"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'showcase');