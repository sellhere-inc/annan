create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','annan','user');
create type public.account_status as enum ('payment','pending','approved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role public.user_role not null default 'user',
  status public.account_status not null default 'approved',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

create table public.violations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  added_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index violations_person_id_idx on public.violations(person_id);
create index profiles_status_idx on public.profiles(status);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Make the first admin manually after creating that auth account:
-- update public.profiles set role='admin', status='approved' where email='YOUR_ADMIN_EMAIL';

-- For the requested "plain DB check" demo setup, RLS is intentionally disabled.
-- This is NOT safe for production.
alter table public.profiles disable row level security;
alter table public.violations disable row level security;
