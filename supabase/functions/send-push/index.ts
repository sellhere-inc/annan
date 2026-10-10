// Supabase Edge Function: sends Web Push notifications from database webhooks.
// Secrets needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com), WEBHOOK_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

async function notify(userIds: string[], payload: { title: string; body: string; url?: string; tag?: string }) {
  if (!userIds.length) return
  const { data: subs, error } = await db.from('push_subscriptions').select('*').in('user_id', userIds)
  if (error) throw error
  if (!subs?.length) console.warn('No push subscriptions for recipients', { count: userIds.length })
  let failed = 0
  await Promise.all((subs || []).map(async s => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 }
      )
    } catch (e: any) {
      failed++
      console.error('Push delivery failed', { statusCode: e?.statusCode, message: e?.message })
      // Subscription expired or revoked: remove it
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }
  }))
  if (failed) throw new Error(`${failed} push delivery attempt(s) failed; check function logs.`)
}

Deno.serve(async req => {
  if (!Deno.env.get('WEBHOOK_SECRET') || req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }
  try {
  const { type, table, record, old_record } = await req.json()

  if (table === 'violations' && type === 'INSERT') {
    await notify([record.person_id], {
      title: 'New violation added',
      body: record.reason,
      tag: 'violation'
    })
  }

  if (table === 'profiles' && type === 'UPDATE') {
    if (old_record?.status !== 'approved' && record.status === 'approved') {
      await notify([record.id], {
        title: 'Account approved',
        body: 'Your Annan Pro account is now active.',
        tag: 'approved'
      })
    }
    if (old_record?.status !== 'pending' && record.status === 'pending') {
      const { data: admins, error }  = await db.from('profiles').select('id').eq('role', 'admin')
      if (error) throw error
      await notify((admins || []).map(a => a.id), {
        title: 'New approval request',
        body: `${record.name || record.email || 'Someone'} submitted a payment.`,
        tag: 'request'
      })
    }
  }

  return new Response('ok')
  } catch (error) {
    console.error('Notification webhook failed', error)
    return new Response('Notification delivery failed; check function logs.', { status: 500 })
  }
})
