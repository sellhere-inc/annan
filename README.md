# Annan Pro

Minimal Vite + Supabase one-page frontend.

## Flow

1. Sign in or create an account.
2. New account is created in `profiles` with `status = payment`.
3. Frontend shows a ₹4.99 Google Pay-style demo screen.
4. Clicking "I've completed payment" changes the account to `pending`.
5. Admin sees pending requests and can approve them.
6. Approved users can view the people list.
7. `admin` and `annan` can add violations.
8. `admin` and `annan` can remove violations one by one.
9. People are sorted by violation count, highest first.
10. `OFF` means violation count > 0; `ON` means zero.

## Supabase

Run `supabase/migrations/001_annan_pro.sql` in the Supabase SQL editor.

Create the first Auth user, then run:

update public.profiles
set role='admin', status='approved'
where email='YOUR_ADMIN_EMAIL';

Put Supabase credentials in `.env`.

## Local

npm install
npm run dev

## Vercel

Deploy as a Vite app. Add:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Important: the Google Pay screen is intentionally frontend-only as requested. It does not verify a real payment. Replace it with a real payment gateway before accepting actual money.
