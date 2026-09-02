ALTER TABLE public.profiles DISABLE TRIGGER USER;

UPDATE public.profiles
SET platform_tier = 'vip',
    kyc_status = 'approved',
    kyc_approved_at = now(),
    verification_status = 'verified',
    age_confirmed = true,
    updated_at = now()
WHERE id = 'd1bcd0d2-9f52-4f84-996c-1a2beebf742e';

ALTER TABLE public.profiles ENABLE TRIGGER USER;