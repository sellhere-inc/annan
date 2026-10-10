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

## Push notifications

The frontend must be served over HTTPS (localhost also works).

1. Run `supabase/migrations/002_push_subscriptions.sql` in the Supabase SQL editor.
2. Generate a VAPID key pair using `npx web-push generate-vapid-keys`. Set
   `VITE_VAPID_PUBLIC_KEY` in the frontend environment and rebuild/redeploy.
3. Set Edge Function secrets `VAPID_PUBLIC_KEY` (the same public key),
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a `mailto:` contact), and a random
   `WEBHOOK_SECRET`.
4. Deploy with `supabase functions deploy send-push --no-verify-jwt`.
   The function authenticates database webhooks using `x-webhook-secret`.
5. In Supabase Database Webhooks, configure POST webhooks for INSERT on
   `public.violations` and UPDATE on `public.profiles`, targeting
   `https://<project-ref>.supabase.co/functions/v1/send-push`. Add the header
   `x-webhook-secret` with the matching secret and `Content-Type: application/json`.
6. Sign in on each receiving device and use the persistent Enable notifications
   banner. On iOS, install to the Home Screen and open the installed app first.

A violation notifies the affected person; an approval notifies the approved user;
submitting payment notifies admins. Each recipient needs their own saved subscription.
The banner disappears only after browser permission and subscription storage succeed.

If delivery fails, check Database Webhook responses and Edge Function logs. Missing
subscriptions are logged; push-provider failures now produce HTTP 500 instead of a
misleading success. HTTP 404/410 subscriptions are removed. A successful provider
response means the push was accepted, not proof that the device displayed it.
