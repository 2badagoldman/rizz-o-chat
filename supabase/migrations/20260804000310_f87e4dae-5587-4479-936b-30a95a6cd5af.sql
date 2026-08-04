UPDATE public.showcase_media SET is_active = false, updated_at = now()
WHERE split_part(storage_path, '/', 2) = '5eccde69-5727-4982-beda-0ac14ca86593.jpg';