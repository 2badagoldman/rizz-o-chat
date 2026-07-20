
DO $$ BEGIN
  CREATE TYPE public.gender AS ENUM ('female','male','nonbinary','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender public.gender;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type public.account_type;
  v_display TEXT;
  v_age_confirmed BOOLEAN;
  v_gender public.gender;
BEGIN
  v_account_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type',''), 'member')::public.account_type;
  v_display := COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''), split_part(NEW.email, '@', 1));
  v_age_confirmed := COALESCE((NEW.raw_user_meta_data->>'age_confirmed')::boolean, false);
  BEGIN
    v_gender := NULLIF(NEW.raw_user_meta_data->>'gender','')::public.gender;
  EXCEPTION WHEN others THEN v_gender := NULL; END;

  INSERT INTO public.profiles (id, account_type, display_name, age_confirmed, gender)
  VALUES (NEW.id, v_account_type, v_display, v_age_confirmed, v_gender)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, coin_balance) VALUES (NEW.id, 500)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
