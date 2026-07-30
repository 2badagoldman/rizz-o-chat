-- Stripe compliance: only fully-clothed, non-suggestive showcase imagery stays live.
UPDATE public.showcase_media SET is_active = false WHERE is_active = true;

UPDATE public.showcase_media SET is_active = true
WHERE storage_path LIKE '%1ae00e93%'
   OR storage_path LIKE '%1d2061b9%'
   OR storage_path LIKE '%6b70795d%'
   OR storage_path LIKE '%6f8a358b%'
   OR storage_path LIKE '%c1916c23%'
   OR storage_path LIKE '%d55c566a%';