UPDATE public.showcase_media
SET is_active = false, updated_at = now()
WHERE split_part(storage_path, '/', 2) IN (
'0a012a2e-f1f6-4979-9770-c7a74146c246.jpg','12159a5a-3a2c-4ca6-b932-0a2b0eddb506.jpg','60911ed7-42c4-4f6f-8bd6-2583089e2a08.jpeg','620ee5cd-9244-49c9-ae8b-348652cb69e6.jpg','6463938f-ad7a-4da0-959c-4bba6f773485.webp','6514c139-1cce-4599-addb-44009cdce016.jpeg','89f72a41-9bcf-4ca3-b32b-4de41b94e370.jpg','abf05973-9ebb-4961-bed5-3cb38feb9e14.jpg','bc59ff96-7bb9-495d-b15c-c32389327d7b.jpg','e55e988c-58d2-492d-a28b-69b5e663544c.jpeg','f897185b-b477-4e22-b084-cf0090aab921.jpg'
);