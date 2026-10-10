begin;

-- Retire the old account-approval notification webhooks before updating accounts.
drop trigger if exists profiles_push_update on public.profiles;
drop trigger if exists notify_account_push on public.profiles;

alter table public.profiles alter column status set default 'approved';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'approved'
  );
  return new;
end;
$$;

update public.profiles
set status = 'approved'
where status in ('payment', 'pending');

commit;
