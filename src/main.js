import { supabase } from './supabase.js'
import './style.css'

const app = document.querySelector('#root')
const PRICE = '4.99'
const GPAY_ID = import.meta.env.VITE_GPAY_ID || ''

let state = {
  session: null,
  profile: null,
  people: [],
  requests: [],
  authMode: 'login'
}

const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]))

function layout(content) {
  return `
    <header class="nav">
      <div class="brand">annan<span>pro</span></div>
      ${state.session ? `<button id="logout" class="nav-link">Log out</button>` : ''}
    </header>
    <main>${content}</main>
  `
}

function authView() {
  const login = state.authMode === 'login'

  return layout(`
    <section class="auth-page">
      <div class="auth-intro">
        <div class="brand-large">annan<span>pro</span></div>
        <p class="eyebrow">${login ? 'WELCOME BACK' : 'GET STARTED'}</p>
        <h1>${login ? 'Sign in.' : 'Create account.'}</h1>
        <p>
          ${login
            ? 'Sign in to continue to your Annan Pro board.'
            : 'Create your account to request access.'}
        </p>
      </div>

      <div class="auth-card">
        <div class="auth-switch">
          <button id="show-login" class="${login ? 'active' : ''}">
            Sign in
          </button>
          <button id="show-signup" class="${!login ? 'active' : ''}">
            Create account
          </button>
        </div>

        <div class="form-fields">
          ${!login ? `
            <div class="field">
              <label>Name</label>
              <input
                id="name"
                placeholder="Your name"
                autocomplete="name"
              >
            </div>
          ` : ''}

          <div class="field">
            <label>Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
            >
          </div>

          <div class="field">
            <label>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              autocomplete="${login ? 'current-password' : 'new-password'}"
            >
          </div>
        </div>

        <button id="auth-action" class="primary full">
          ${login ? 'Sign in' : 'Create account'}
        </button>

        <p id="auth-msg" class="msg"></p>
      </div>
    </section>
  `)
}

function paymentView() {
  return layout(`
    <section class="payment-page">
      <div class="payment-copy">
        <p class="eyebrow">ACCOUNT ACTIVATION</p>
        <h1>One small step.</h1>
        <p>
          Complete the ₹${PRICE} payment and submit your account
          for approval.
        </p>
      </div>

      <div class="payment-card">
        <div class="payment-header">
          <div>
            <span class="muted-label">TOTAL</span>
            <strong>₹${PRICE}</strong>
          </div>
          <div class="payment-badge">UPI</div>
        </div>

        <div class="gpay-box">
          <div class="gpay-logo">
            <span class="gpay-g">G</span>
            <span>Google Pay</span>
          </div>

          <p class="payment-description">
            Pay using Google Pay or another UPI app.
          </p>

          ${GPAY_ID
            ? `<div class="upi-id">
                <span>UPI ID</span>
                <strong>${esc(GPAY_ID)}</strong>
              </div>`
            : `
              <div class="warning">
                Add <strong>VITE_GPAY_ID</strong> to your .env file.
              </div>
            `
          }

          <button id="pay" class="primary full payment-button">
            Pay ₹${PRICE}
          </button>

          <button id="paid" class="secondary full">
            I've completed the payment
          </button>

          <p class="payment-note">
            Payment is manually verified by the admin.
          </p>
        </div>
      </div>
    </section>
  `)
}

function pendingView() {
  return layout(`
    <section class="state-page">
      <div class="state-card">
        <div class="state-icon">✓</div>
        <p class="eyebrow">REQUEST SUBMITTED</p>
        <h1>You're all set.</h1>
        <p>
          Your payment has been submitted. Your account will become
          available once an admin approves it.
        </p>

        <button id="logout" class="secondary">
          Log out
        </button>
      </div>
    </section>
  `)
}

function peopleMarkup(canEdit) {
  if (!state.people.length) {
    return `
      <div class="empty">
        <strong>No people yet</strong>
        <span>People will appear here once they are approved.</span>
      </div>
    `
  }

  return state.people.map(person => {
    const count = person.violations.length
    const off = count > 0

    return `
      <article class="person">
        <div class="person-row">
          <div class="person-info">
            <div class="avatar">
              ${esc(person.name?.[0] || '?').toUpperCase()}
            </div>

            <div class="person-details">
              <h3>${esc(person.name)}</h3>
              <span>
                ${count} violation${count === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div class="status ${off ? 'off' : 'on'}">
            <i></i>
            ${off ? 'OFF' : 'ON'}
          </div>
        </div>

        ${off ? `
          <div class="violations">
            ${person.violations.map(v => `
              <div class="violation">
                <span>${esc(v.reason)}</span>

                ${canEdit
                  ? `
                    <button
                      class="remove"
                      data-id="${v.id}"
                      aria-label="Remove violation"
                    >
                      Remove
                    </button>
                  `
                  : ''
                }
              </div>
            `).join('')}
          </div>
        ` : ''}
      </article>
    `
  }).join('')
}

function userBoard() {
  return layout(`
    <section class="board-head">
      <div class="board-title">
        <p class="eyebrow">USER BOARD</p>
        <h1>People.</h1>
        <p>See the current status of everyone.</p>
      </div>

      <div class="account">
        <span class="account-name">${esc(state.profile.name)}</span>
        <span class="role">User</span>
      </div>
    </section>

    <section class="board-content">
      <div class="section-title">
        <div>
          <span class="eyebrow">OVERVIEW</span>
          <h2>People</h2>
        </div>
        <span class="count">${state.people.length}</span>
      </div>

      <div class="people">
        ${peopleMarkup(false)}
      </div>
    </section>
  `)
}

function annanBoard() {
  return layout(`
    <section class="board-head">
      <div class="board-title">
        <p class="eyebrow">ANNAN BOARD</p>
        <h1>Manage.</h1>
        <p>Add or remove violations.</p>
      </div>

      <div class="account">
        <span class="account-name">${esc(state.profile.name)}</span>
        <span class="role">Annan</span>
      </div>
    </section>

    <section class="board-content">
      <div class="section-title">
        <div>
          <span class="eyebrow">PEOPLE</span>
          <h2>All people</h2>
        </div>
        <span class="count">${state.people.length}</span>
      </div>

      <div class="people">
        ${peopleMarkup(true)}
      </div>

      <div class="tool-card">
        <div class="tool-heading">
          <span class="eyebrow">ACTION</span>
          <h2>Add violation</h2>
          <p>Add a violation to a person's record.</p>
        </div>

        <div class="tool-form">
          <div class="field">
            <label>Person</label>
            <select id="person">
              ${state.people.map(p => `
                <option value="${p.id}">
                  ${esc(p.name)}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Reason</label>
            <input id="reason" placeholder="Enter reason">
          </div>

          <button id="add" class="primary add-button">
            Add violation
          </button>
        </div>
      </div>
    </section>
  `)
}

function adminBoard() {
  return layout(`
    <section class="board-head">
      <div class="board-title">
        <p class="eyebrow">ADMIN BOARD</p>
        <h1>Control.</h1>
        <p>Approve accounts and manage people.</p>
      </div>

      <div class="account">
        <span class="account-name">${esc(state.profile.name)}</span>
        <span class="role">Admin</span>
      </div>
    </section>

    <section class="board-content">
      <div class="section-title">
        <div>
          <span class="eyebrow">ACCESS</span>
          <h2>Approval requests</h2>
        </div>
        <span class="count">${state.requests.length}</span>
      </div>

      <div class="requests">
        ${
          state.requests.length
            ? state.requests.map(r => `
              <div class="request">
                <div class="request-info">
                  <div class="avatar">
                    ${esc(r.name?.[0] || '?').toUpperCase()}
                  </div>

                  <div>
                    <strong>${esc(r.name)}</strong>
                    <span>${esc(r.email)}</span>
                  </div>
                </div>

                <button
                  class="primary approve"
                  data-id="${r.id}"
                >
                  Approve
                </button>
              </div>
            `).join('')
            : `
              <div class="empty">
                <strong>No pending requests</strong>
                <span>New account requests will appear here.</span>
              </div>
            `
        }
      </div>

      <div class="section-title people-title">
        <div>
          <span class="eyebrow">PEOPLE</span>
          <h2>All people</h2>
        </div>
        <span class="count">${state.people.length}</span>
      </div>

      <div class="people">
        ${peopleMarkup(true)}
      </div>
    </section>
  `)
}

async function getProfile(id) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  return data
}

async function loadData() {
  const { data: people } = await supabase
    .from('profiles')
    .select('id,name,email,role,status,violations(id,reason,created_at)')
    .eq('status', 'approved')

  state.people = (people || [])
    .filter(p => p.role !== 'admin')
    .sort((a, b) => b.violations.length - a.violations.length)

  if (state.profile.role === 'admin') {
    const { data: requests } = await supabase
      .from('profiles')
      .select('id,name,email')
      .eq('status', 'pending')

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

  if (!state.profile) {
    return supabase.auth.signOut()
  }

  if (state.profile.status === 'payment') {
    app.innerHTML = paymentView()
    bindPayment()
    return
  }

  if (
    state.profile.status === 'pending' &&
    state.profile.role !== 'admin'
  ) {
    app.innerHTML = pendingView()
    document.querySelector('#logout').onclick = logout
    return
  }

  await loadData()

  if (state.profile.role === 'admin') {
    app.innerHTML = adminBoard()
  } else if (state.profile.role === 'annan') {
    app.innerHTML = annanBoard()
  } else {
    app.innerHTML = userBoard()
  }

  bindBoard()
}

function bindAuth() {
  document.querySelector('#show-login').onclick = () => {
    state.authMode = 'login'
    render()
  }

  document.querySelector('#show-signup').onclick = () => {
    state.authMode = 'signup'
    render()
  }

  document.querySelector('#auth-action').onclick =
    state.authMode === 'login' ? login : signup
}

async function login() {
  const email = document.querySelector('#email').value.trim()
  const password = document.querySelector('#password').value
  const msg = document.querySelector('#auth-msg')

  if (!email || !password) {
    msg.textContent = 'Enter your email and password.'
    return
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) msg.textContent = error.message
}

async function signup() {
  const name = document.querySelector('#name').value.trim()
  const email = document.querySelector('#email').value.trim()
  const password = document.querySelector('#password').value
  const msg = document.querySelector('#auth-msg')

  if (!name || !email || !password) {
    msg.textContent = 'Fill in all fields.'
    return
  }

  if (password.length < 6) {
    msg.textContent = 'Password must be at least 6 characters.'
    return
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })

  if (error) {
    msg.textContent = error.message
  } else {
    msg.textContent = 'Account created. Continue to payment.'
  }
}

function bindPayment() {
  document.querySelector('#logout').onclick = logout
  document.querySelector('#pay').onclick = openGPay
  document.querySelector('#paid').onclick = submitPayment
}

function openGPay() {
  if (!GPAY_ID) {
    alert('Add VITE_GPAY_ID to your .env file first.')
    return
  }

  const url =
    `tez://upi/pay?pa=${encodeURIComponent(GPAY_ID)}` +
    `&pn=${encodeURIComponent('Annan Pro')}` +
    `&am=${PRICE}&cu=INR`

  window.location.href = url
}

async function submitPayment() {
  await supabase
    .from('profiles')
    .update({
      payment_status: 'submitted',
      status: 'pending'
    })
    .eq('id', state.session.user.id)

  state.profile = await getProfile(state.session.user.id)
  render()
}

async function addViolation() {
  const person_id = document.querySelector('#person').value
  const reason = document.querySelector('#reason').value.trim()

  if (!reason) return

  await supabase.from('violations').insert({
    person_id,
    reason,
    added_by: state.session.user.id
  })

  render()
}

async function removeViolation(id) {
  await supabase
    .from('violations')
    .delete()
    .eq('id', id)

  render()
}

async function approve(id) {
  await supabase
    .from('profiles')
    .update({
      status: 'approved'
    })
    .eq('id', id)

  render()
}

function bindBoard() {
  document.querySelector('#logout')?.addEventListener('click', logout)

  document.querySelector('#add')?.addEventListener(
    'click',
    addViolation
  )

  document.querySelectorAll('.remove').forEach(button => {
    button.onclick = () => removeViolation(button.dataset.id)
  })

  document.querySelectorAll('.approve').forEach(button => {
    button.onclick = () => approve(button.dataset.id)
  })
}

async function logout() {
  await supabase.auth.signOut()
}

supabase.auth.onAuthStateChange((_event, session) => {
  state.session = session
  render()
})

const { data } = await supabase.auth.getSession()
state.session = data.session

render()
