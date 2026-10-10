// Web Push client helpers (Chrome, Edge, Firefox, Safari 16+, iOS 16.4+ when installed to Home Screen)
import { supabase } from './supabase.js'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

const urlB64ToUint8 = b64 => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try { return await navigator.serviceWorker.register('/sw.js') } catch { return null }
}

// Returns one of:
// unsupported | needs-install | no-key | blocked | on | off
export async function pushStatus() {
  if (isIOS() && !isStandalone()) return 'needs-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (!VAPID_PUBLIC) return 'no-key'
  if (Notification.permission === 'denied') return 'blocked'
  try {
    const reg = (await navigator.serviceWorker.getRegistration()) || (await registerSW())
    const sub = await reg?.pushManager.getSubscription()
    if (sub && Notification.permission === 'granted') return 'on'
  } catch {}
  return 'off'
}

// Must be called from a click handler (Safari requires a user gesture for the permission prompt).
export async function enablePush(userId) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')
  if (!userId || !VAPID_PUBLIC) throw new Error('Notification setup is unavailable.')
  if (!(await registerSW())) throw new Error('Could not register the notification service worker.')
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8(VAPID_PUBLIC)
    })
  }
  const j = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

// Re-sync an existing subscription to the logged-in user (e.g. after login on same browser).
export async function syncSubscription(userId) {
  if (!('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted' || !VAPID_PUBLIC) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) throw new Error('Notification subscription is missing.')
  const j = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
}
