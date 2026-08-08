ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_profile_privilege_escalation;

UPDATE public.profiles
   SET display_name = 'App Review',
       account_type = 'member',
       verification_status = 'verified',
       platform_tier = 'vip',
       age_confirmed = true,
       kyc_status = 'approved',
       kyc_approved_at = now(),
       kyc_due_at = now() + interval '3650 days',
       date_of_birth = '1990-01-01',
       bio = 'Store review / QA test account.'
 WHERE id = '1f7a999a-02dd-40d6-8f27-d79474addeec';

ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_profile_privilege_escalation;

INSERT INTO public.wallets (user_id, coin_balance)
VALUES ('1f7a999a-02dd-40d6-8f27-d79474addeec', 5000)
ON CONFLICT (user_id) DO UPDATE SET coin_balance = 5000;