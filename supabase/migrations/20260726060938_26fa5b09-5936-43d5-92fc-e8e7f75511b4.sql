alter table public.profiles disable trigger user;
insert into public.profiles (id, account_type, display_name, age_confirmed, gender, kyc_status, kyc_approved_at, verification_status, date_of_birth)
values ('ff8193d8-e095-4362-bf87-a7b6aab0e867','member','Stripe Reviewer',true,'other','approved',now(),'verified','1990-01-01')
on conflict (id) do update set kyc_status='approved', kyc_approved_at=now(), age_confirmed=true, verification_status='verified';
alter table public.profiles enable trigger user;