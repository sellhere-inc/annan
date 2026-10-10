// Inline SVG illustrations for Annan Pro
const INK = '#2a1f6b', GOLD = '#ffb81c', PINK = '#ff4f8b', LEAF = '#2f9e5b'
const RED = '#e5322d', SKY = '#8fd3ff', MINT = '#bff0d4', WHITE = '#fff'
const svg = (vb, body, cls = '') =>
  `<svg class="${cls}" viewBox="${vb}" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`

// Annan: sunglasses, handlebar mustache, clipboard
export const annan = () => svg('0 0 260 280', `
  <path d="M20 280V120a110 110 0 0 1 220 0v160z" fill="${SKY}" ${S}/>
  <path d="M60 280c0-50 30-72 70-72s70 22 70 72z" fill="${GOLD}" ${S}/>
  <circle cx="130" cy="130" r="52" fill="#c98a5b" ${S}/>
  <path d="M80 112c4-34 28-48 52-48s46 14 50 48c-14-18-30-24-50-24s-36 6-52 24z" fill="${INK}" ${S}/>
  <rect x="86" y="112" width="40" height="26" rx="10" fill="${INK}" ${S}/>
  <rect x="134" y="112" width="40" height="26" rx="10" fill="${INK}" ${S}/>
  <path d="M126 122h8" ${S}/>
  <path d="M130 158c-14-12-34-6-44 4 10 2 20-2 28 4 8 4 14 2 16-4 2 6 8 8 16 4 8-6 18-2 28-4-10-10-30-16-44-4z" fill="${INK}" ${S}/>
  <path d="M116 176q14 8 28 0" fill="none" ${S}/>
  <g transform="rotate(8 190 220)">
    <rect x="160" y="170" width="70" height="92" rx="8" fill="${WHITE}" ${S}/>
    <rect x="182" y="162" width="26" height="14" rx="4" fill="${PINK}" ${S}/>
    <path d="M172 196h46M172 212h46M172 228h30" ${S}/>
    <circle cx="214" cy="246" r="6" fill="${LEAF}" ${S}/><circle cx="196" cy="246" r="6" fill="${RED}" ${S}/>
  </g>`, 'art-annan')

// Four people, each with a status lamp overhead
export const crowd = () => {
  const skin = ['#c98a5b', '#8d5a3b', '#e0ac82', '#a86f48']
  const shirt = [PINK, SKY, GOLD, MINT], lamp = [LEAF, LEAF, RED, LEAF]
  return svg('0 0 400 190', [0, 1, 2, 3].map(i => `
    <g transform="translate(${i * 95 + 12} 0)">
      <path d="M38 6v22" ${S}/><circle cx="38" cy="38" r="12" fill="${lamp[i]}" ${S}/>
      <circle cx="38" cy="86" r="26" fill="${skin[i]}" ${S}/>
      <path d="M12 82c2-26 52-26 52 0-14-10-38-10-52 0z" fill="${INK}" ${S}/>
      <path d="M2 190c0-44 14-62 36-62s36 18 36 62z" fill="${shirt[i]}" ${S}/>
    </g>`).join(''), 'art-crowd')
}

// Fan of request cards with approval badge
export const requests = () => svg('0 0 300 190', `
  <g transform="rotate(-14 90 150)"><rect x="40" y="40" width="100" height="130" rx="10" fill="${MINT}" ${S}/></g>
  <g transform="rotate(-2 150 150)"><rect x="95" y="28" width="100" height="136" rx="10" fill="${GOLD}" ${S}/></g>
  <g transform="rotate(12 210 150)"><rect x="150" y="38" width="100" height="130" rx="10" fill="${PINK}" ${S}/></g>
  <circle cx="148" cy="96" r="22" fill="${WHITE}" ${S}/><circle cx="148" cy="96" r="14" fill="${LEAF}" ${S}/>
  <path d="M141 96l5 5 9-10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`, 'art-requests')

// Referee cards
export const refCards = () => svg('0 0 120 100', `
  <g transform="rotate(-12 40 60)"><rect x="14" y="14" width="46" height="66" rx="6" fill="${GOLD}" ${S}/></g>
  <g transform="rotate(10 80 60)"><rect x="56" y="20" width="46" height="66" rx="6" fill="${RED}" ${S}/></g>`, 'art-refs')

export const refCard = () => svg('0 0 20 28', `<rect x="3" y="3" width="14" height="22" rx="3" fill="${RED}" stroke="${INK}" stroke-width="2.5"/>`, 'ref')

// Glass of chaya (empty states)
export const chaya = () => svg('0 0 120 120', `
  <path d="M40 18c-8 10 8 14 0 24M62 14c-8 10 8 14 0 28M84 18c-8 10 8 14 0 24" fill="none" ${S}/>
  <path d="M30 52h60l-6 56H36z" fill="#f4c27a" ${S}/><path d="M34 74h52l-3 34H37z" fill="#b8641f" opacity=".85"/>
  <path d="M30 52h60l-6 56H36z" fill="none" ${S}/>`, 'art-chaya')

// Approval badge + alarm clock (waiting page)
export const waiting = () => svg('0 0 260 180', `
  <circle cx="80" cy="96" r="52" fill="${GOLD}" ${S}/><circle cx="80" cy="96" r="36" fill="${LEAF}" ${S}/>
  <path d="M62 96l13 14 26-28" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M170 40l-18 14M222 40l18 14" ${S}/>
  <circle cx="196" cy="106" r="46" fill="${PINK}" ${S}/><circle cx="196" cy="106" r="34" fill="#fff" ${S}/>
  <path d="M196 106V86M196 106l14 8" fill="none" ${S}/><path d="M178 160l-8 14M214 160l8 14" ${S}/>`, 'art-waiting')

// Payment: phone, drifting coins, confetti
export const payment = () => {
  const coin = (x, y, d) => `<g class="coin" style="animation-delay:${d}s"><circle cx="${x}" cy="${y}" r="20" fill="${GOLD}" ${S}/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="22" font-weight="800" fill="${INK}">₹</text></g>`
  const bits = [[30, 40, SKY], [250, 70, LEAF], [60, 250, GOLD], [270, 220, SKY], [150, 20, MINT], [20, 150, INK]]
    .map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="12" height="12" rx="3" fill="${c}" transform="rotate(${i * 35} ${x} ${y})"/>`).join('')
  return svg('0 0 300 320', `${bits}
    <rect x="90" y="40" width="130" height="240" rx="24" fill="${INK}"/>
    <rect x="100" y="60" width="110" height="196" rx="12" fill="#fff"/>
    <circle cx="155" cy="124" r="30" fill="${LEAF}" ${S}/><path d="M142 124l9 10 18-20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="118" y="176" width="74" height="12" rx="6" fill="${SKY}"/><rect x="128" y="200" width="54" height="12" rx="6" fill="${GOLD}"/>
    ${coin(58, 100, 0)}${coin(246, 150, -2)}${coin(70, 210, -4)}`, 'art-pay')
}

// Colourful Google Pay "G"
export const gpayG = () => svg('0 0 40 40', `
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#4285f4"/><stop offset=".4" stop-color="#ea4335"/>
  <stop offset=".7" stop-color="#fbbc05"/><stop offset="1" stop-color="#34a853"/></linearGradient></defs>
  <text x="20" y="32" text-anchor="middle" font-size="36" font-weight="800" fill="url(#g)" font-family="Hanken Grotesk, sans-serif">G</text>`, 'gpay-g')
