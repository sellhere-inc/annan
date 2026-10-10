import { supabase } from './supabase.js'
import './style.css'
import { registerSW, pushStatus, enablePush, syncSubscription } from './push.js'
import * as A from './art.js'

const app = document.querySelector('#root')
const PRICE = '1.99'
const GPAY_ID = import.meta.env.VITE_GPAY_ID || ''
const $ = s => document.querySelector(s)

let checkingNotifications = false
let enablingNotifications = false
let state = { error: '', session: null, profile: null, people: [], requests: [], authMode: 'login' }

const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]))
const initial = n => esc(n?.[0] || '?').toUpperCase()

const layout = c => `
  <header class="nav">
    <div class="brand">annan<span>pro</span></div>
    ${state.session ? `<button data-logout class="nav-link">Log out</button>` : ''}
  </header>
  <main><div id="notification-banner"></div>${state.error ? `<div class="banner">Couldn't load data: ${esc(state.error)}</div>` : ''}${c}</main>`

const head = (tag, h, sub, role, art) => `
  <section class="board-head">
    <div class="board-title">
      <p class="tag">${tag}</p><h1>${h}</h1><p>${sub}</p>
      <div class="account"><span class="account-name">${esc(state.profile.name)}</span><span class="role">${role}</span></div>
    </div>
    <div class="art">${art}</div>
  </section>`

const title = (tag, h, n) => `
  <div class="section-title">
    <div><span class="tag">${tag}</span><h2>${h}</h2></div><span class="count">${n}</span>
  </div>`

const empty = (t, s) => `<div class="empty">${A.chaya()}<strong>${t}</strong><span>${s}</span></div>`

function authView() {
  const login = state.authMode === 'login'
  return layout(`
    <section class="auth-page">
      <div class="auth-intro">
        <div class="art">${A.annan()}</div>
        <p class="tag">${login ? 'Welcome back' : 'Get started'}</p>
        <h1>${login ? 'Sign in.' : 'Create account.'}</h1>
        <p>${login ? 'Sign in to continue to your Annan Pro board.' : 'Create your account to request access.'}</p>
      </div>
      <div class="auth-card">
        <div class="auth-switch">
          <button id="show-login" class="${login ? 'active' : ''}">Sign in</button>
          <button id="show-signup" class="${!login ? 'active' : ''}">Create account</button>
        </div>
        <div class="form-fields">
          ${!login ? `<div class="field"><label>Name</label><input id="name" placeholder="Your name" autocomplete="name"></div>` : ''}
          <div class="field"><label>Email</label><input id="email" type="email" placeholder="you@example.com" autocomplete="email"></div>
          <div class="field"><label>Password</label><input id="password" type="password" placeholder="Your password" autocomplete="${login ? 'current-password' : 'new-password'}"></div>
        </div>
        <button id="auth-action" class="primary full">${login ? 'Sign in' : 'Create account'}</button>
        <p id="auth-msg" class="msg"></p>
      </div>
    </section>`)
}

function paymentView() {
  return layout(`
    <section class="payment-page">
      <div class="payment-copy">
        <div class="art">${A.payment()}</div>
        <h1>One small step.</h1>
        <p>Complete the ₹${PRICE} payment and submit your account for approval.</p>
      </div>
      <div class="payment-card">
        <div class="payment-header">
          <div><span class="muted-label">Total</span><strong>₹${PRICE}</strong></div>
          <div class="payment-badge">UPI</div>
        </div>
        <div class="gpay-box">
          <div class="gpay-logo">${A.gpayG()}<span>Google Pay</span></div>
          <p class="payment-description">Pay using Google Pay or another UPI app.</p>
          ${GPAY_ID ? '' : `<div class="warning">Add <strong>VITE_GPAY_ID</strong> to your .env file.</div>`}
          <button id="pay" class="primary full">Pay ₹${PRICE}</button>
          <button id="paid" class="secondary full">I've completed the payment</button>
          <p class="payment-note">Payment is manually verified by the admin.</p>
        </div>
      </div>
    </section>`)
}

function pendingView() {
  return layout(`
    <section class="state-page">
      <div class="state-card">
        <div class="art">${A.waiting()}</div>
        <p class="tag">Request submitted</p>
        <h1>You're all set.</h1>
        <p>Your payment has been submitted. Your account will become available once an admin approves it.</p>
        <button data-logout class="secondary">Log out</button>
      </div>
    </section>`)
}

function peopleMarkup(canEdit) {
  if (!state.people.length) return empty('No people yet', 'People will appear here once they are approved.')
  return state.people.map(p => {
    const n = p.violations.length, off = n > 0
    return `
      <article class="person ${off ? 'is-off' : ''}">
        <div class="person-row">
          <div class="person-info">
            <div class="avatar">${initial(p.name)}</div>
            <div class="person-details"><h3>${esc(p.name)}</h3><span>${n} violation${n === 1 ? '' : 's'}</span></div>
          </div>
          <div class="status ${off ? 'off' : 'on'}"><i></i>${off ? 'OFF' : 'ON'}<b>${n}</b></div>
        </div>
        ${off ? `<div class="violations">${p.violations.map(v => `
          <div class="violation">
            ${A.refCard()}<span>${esc(v.reason)}</span>
            ${canEdit ? `<button class="remove" data-id="${v.id}" aria-label="Remove violation">Remove</button>` : ''}
          </div>`).join('')}</div>` : ''}
      </article>`
  }).join('')
}

const userBoard = () => layout(`
  ${head('User board', 'People.', 'See the current status of everyone.', 'User', A.crowd())}
  <section class="board-content">
    ${title('Overview', 'People', state.people.length)}
    <div class="people">${peopleMarkup(false)}</div>
  </section>`)

const annanBoard = () => layout(`
  ${head('Annan board', 'Manage.', 'Add or remove violations.', 'Annan', A.annan())}
  <section class="board-content">
    ${title('People', 'All people', state.people.length)}
    <div class="people">${peopleMarkup(true)}</div>
    <div class="tool-card">
      <div class="art">${A.refCards()}</div>
      <div class="tool-heading"><h2>Add violation</h2><p>Add a violation to a person's record.</p></div>
      <div class="tool-form">
        <div class="field"><label>Person</label>
          <select id="person">${state.people.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Reason</label><input id="reason" placeholder="Enter reason"></div>
        <button id="add" class="primary add-button">Add violation</button>
        <p id="add-msg" class="msg"></p>
      </div>
    </div>
  </section>`)

const adminBoard = () => layout(`
  ${head('Admin board', 'Control.', 'Approve accounts and manage people.', 'Admin', A.requests())}
  <section class="board-content">
    ${title('Access', 'Approval requests', state.requests.length)}
    <div class="requests">
      ${state.requests.length ? state.requests.map(r => `
        <div class="request">
          <div class="request-info">
            <div class="avatar">${initial(r.name)}</div>
            <div><strong>${esc(r.name)}</strong><span>${esc(r.email)}</span></div>
          </div>
          <button class="primary approve" data-id="${r.id}">Approve</button>
        </div>`).join('') : empty('No pending requests', 'New account requests will appear here.')}
    </div>
    <div class="people-title">${title('People', 'All people', state.people.length)}</div>
    <div class="people">${peopleMarkup(true)}</div>
  </section>`)

async function getProfile(id) {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  return data
}

async function loadData() {
  // Two plain queries instead of a nested join: avoids ambiguous-relationship and embed errors
  const { data: profs, error: e1 } = await supabase
    .from('profiles').select('id,name,email,role,status').eq('status', 'approved')
  const { data: vios, error: e2 } = await supabase
    .from('violations').select('id,reason,created_at,person_id').order('created_at')
  state.error = (e1 || e2)?.message || ''

  const byPerson = {}
  for (const v of vios || []) (byPerson[v.person_id] ||= []).push(v)

  state.people = (profs || [])
    .filter(p => !['admin', 'annan'].includes(p.role))
    .map(p => ({ ...p, name: p.name || p.email || 'Unnamed', violations: byPerson[p.id] || [] }))
    .sort((a, b) => b.violations.length - a.violations.length || a.name.localeCompare(b.name))

  if (state.profile.role === 'admin') {
    const { data: requests, error } = await supabase.from('profiles').select('id,name,email').eq('status', 'pending')
    if (error) state.error = error.message
    state.requests = requests || []
  }
}

async function render() {
  if (!state.session) {
    app.innerHTML = authView()
    bindAuth()
    return
  }
  state.profile = await getProfile(state.session.user.id)
  if (!state.profile) return supabase.auth.signOut()

  if (state.profile.status === 'payment') {
    app.innerHTML = paymentView()
    bindPayment()
    return
  }
  if (state.profile.status === 'pending' && state.profile.role !== 'admin') {
    app.innerHTML = pendingView()
    bindLogout()
    return
  }
  await loadData()
  const r = state.profile.role
  app.innerHTML = r === 'admin' ? adminBoard() : r === 'annan' ? annanBoard() : userBoard()
  bindBoard()
}

// Bug fix: bind every logout button (header + page), not just the first
const bindLogout = () => {
  document.querySelectorAll('[data-logout]').forEach(b => (b.onclick = logout))
  refreshNotifications()
}

function bindAuth() {
  $('#show-login').onclick = () => { state.authMode = 'login'; render() }
  $('#show-signup').onclick = () => { state.authMode = 'signup'; render() }
  $('#auth-action').onclick = state.authMode === 'login' ? login : signup
}

async function login() {
  const email = $('#email').value.trim()
  const password = $('#password').value
  const msg = $('#auth-msg')
  if (!email || !password) { msg.textContent = 'Enter your email and password.'; return }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) msg.textContent = error.message
}

async function signup() {
  const name = $('#name').value.trim()
  const email = $('#email').value.trim()
  const password = $('#password').value
  const msg = $('#auth-msg')
  if (!name || !email || !password) { msg.textContent = 'Fill in all fields.'; return }
  if (password.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return }
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
  msg.textContent = error ? error.message : 'Account created. Continue to payment.'
}

function bindPayment() {
  bindLogout()
  $('#pay').onclick = openGPay
  $('#paid').onclick = submitPayment
}

function openGPay() {
  if (!GPAY_ID) { alert('Add VITE_GPAY_ID to your .env file first.'); return }
  window.location.href =
    `tez://upi/pay?pa=${encodeURIComponent(GPAY_ID)}&pn=${encodeURIComponent('Annan Pro')}&am=${PRICE}&cu=INR`
}

async function submitPayment() {
  await supabase.from('profiles').update({ payment_status: 'submitted', status: 'pending' }).eq('id', state.session.user.id)
  render()
}

async function addViolation() {
  const person_id = $('#person')?.value
  const reason = $('#reason').value.trim()
  const msg = $('#add-msg')
  if (!person_id) { msg.textContent = 'No one to add a violation to yet.'; return }
  if (!reason) { msg.textContent = 'Enter a reason.'; return }
  const { error } = await supabase.from('violations').insert({ person_id, reason, added_by: state.session.user.id })
  if (error) { msg.textContent = error.message; return }
  render()
}

async function removeViolation(id) {
  await supabase.from('violations').delete().eq('id', id)
  render()
}

async function approve(id) {
  await supabase.from('profiles').update({ status: 'approved' }).eq('id', id)
  render()
}

function bindBoard() {
  bindLogout()
  $('#add')?.addEventListener('click', addViolation)
  document.querySelectorAll('.remove').forEach(b => (b.onclick = () => removeViolation(b.dataset.id)))
  document.querySelectorAll('.approve').forEach(b => (b.onclick = () => approve(b.dataset.id)))
}

async function logout() { await supabase.auth.signOut() }

supabase.auth.onAuthStateChange((_event, session) => { state.session = session; render() })

const { data } = await supabase.auth.getSession()
state.session = data.session
render()

// Update only the banner so permission changes never erase an in-progress form.
async function refreshNotifications() {
  if (!state.session || checkingNotifications || enablingNotifications) return
  checkingNotifications = true
  const userId = state.session.user.id
  let status, error = ''
  try {
    status = await pushStatus()
    if (status === 'on') await syncSubscription(userId)
  } catch (e) { status = 'off'; error = `Could not save notification settings: ${e.message || 'Please try again.'}`; console.error(e) }
  finally { checkingNotifications = false }
  if (state.session?.user.id !== userId) return
  showNotificationBanner(status, error)
}

function showNotificationBanner(status, error = '') {
  const host = $('#notification-banner')
  if (!host) return
  if (status === 'on') { host.innerHTML = ''; return }
  const messages = {
    off: 'Enable notifications to receive account updates and violations.',
    blocked: 'Notifications are blocked. Allow notifications in your browser’s site settings, then check again.',
    'needs-install': 'On iPhone or iPad, add this app to your Home Screen, open it there, then enable notifications.',
    unsupported: 'Open this app in a browser that supports notifications over HTTPS.',
    'no-key': 'Notifications are not available yet. Please contact the administrator.'
  }
  host.innerHTML = `<aside class="notification-banner" aria-label="Notifications"><div><strong>Stay updated</strong><p>${esc(messages[status] || messages.off)}</p>${error ? `<p role="alert">${esc(error)}</p>` : ''}</div><button class="secondary" id="enable-notifications">${status === 'off' ? 'Enable notifications' : 'Check again'}</button></aside>`
  $('#enable-notifications').onclick = async () => {
    if (status !== 'off') { await refreshNotifications(); return }
    enablingNotifications = true
    const userId = state.session?.user.id
    const button = $('#enable-notifications')
    button.disabled = true
    button.textContent = 'Enabling…'
    try {
      await enablePush(userId)
      if (state.session?.user.id === userId) showNotificationBanner('on')
    } catch (e) {
      console.error('Notification setup failed', e)
      if (state.session?.user.id === userId) showNotificationBanner(await pushStatus() === 'blocked' ? 'blocked' : 'off', `Notifications could not be enabled: ${e.message || 'Please try again.'}`)
    } finally { enablingNotifications = false }
  }
}

registerSW()
window.addEventListener('focus', refreshNotifications)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshNotifications()
})
