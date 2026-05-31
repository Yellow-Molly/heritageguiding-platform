/**
 * Phase 01 Plan B' spike (capture pass): drive the Bokun SANDBOX hosted widget and
 * capture every /widgets/{uuid}/* request body + response, plus the sessionId source,
 * while selecting date → time → participants → extra → continue.
 *
 * Goal: learn the real shoppingCart wire-shape + session lifecycle so we can test
 * pre-seed + resume in a follow-up pass.
 *
 * Run: node e2e/spike-bokun-widget-cart-capture.mjs
 * Read-only-ish: interacts with a sandbox widget; may build a sandbox cart (no payment).
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

const OUT = path.resolve(
  process.cwd(),
  'plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/raw-output'
)
mkdirSync(OUT, { recursive: true })

const UUID = '11917131-ac6a-45e1-8e99-bd0cf1e318c8'
const EXP = '24010'
const URL = `https://widgets.bokuntest.com/online-sales/${UUID}/experience/${EXP}?lang=en`

const reqLog = []
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, locale: 'en-US' })
const page = await ctx.newPage()

// Capture widget API traffic (request bodies + JSON responses).
page.on('request', (r) => {
  if (/\/widgets\//.test(r.url())) {
    reqLog.push({ phase: 'req', method: r.method(), url: r.url(), postData: r.postData()?.slice(0, 4000) ?? null })
  }
})
page.on('response', async (resp) => {
  const u = resp.url()
  if (/\/widgets\/.*\/(shoppingCart|activity|checkout|payment)/i.test(u)) {
    let body = null
    try { body = (await resp.text()).slice(0, 4000) } catch {}
    reqLog.push({ phase: 'resp', status: resp.status(), url: u, body })
  }
})

const steps = []
async function snap(name) {
  const p = path.join(OUT, `cart-capture-${name}.png`)
  await page.screenshot({ path: p, fullPage: true }).catch(() => {})
  steps.push({ name, screenshot: path.relative(process.cwd(), p) })
}

// Dump interactive elements so we can see how to drive the calendar/steppers/CTA.
async function dumpInteractive(tag) {
  const els = await page.evaluate(() => {
    const out = []
    const nodes = document.querySelectorAll('button, [role="button"], a, [class*="day" i], [class*="calendar" i] td, [data-testid]')
    for (const n of Array.from(nodes).slice(0, 250)) {
      const txt = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)
      const disabled = n.hasAttribute('disabled') || n.getAttribute('aria-disabled') === 'true' || /disabled/i.test(n.className || '')
      out.push({
        tag: n.tagName.toLowerCase(),
        txt,
        testid: n.getAttribute('data-testid') || '',
        cls: (n.className || '').toString().slice(0, 50),
        disabled,
      })
    }
    return out
  }).catch(() => [])
  writeFileSync(path.join(OUT, `cart-capture-dom-${tag}.json`), JSON.stringify(els, null, 2))
  return els
}

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(8000)
await snap('1-loaded')
const dom1 = await dumpInteractive('loaded')
console.log('interactive elements on load:', dom1.length)

// Try to click the first ENABLED future calendar day. Bokun day cells are usually
// table cells / buttons with a numeric label; disabled days carry a disabled class.
const dayClicked = await page.evaluate(() => {
  const candidates = Array.from(document.querySelectorAll('td, button, [role="gridcell"], [class*="day" i]'))
  for (const c of candidates) {
    const t = (c.innerText || '').trim()
    const disabled = c.hasAttribute('disabled') || c.getAttribute('aria-disabled') === 'true' || /disabled|unavailable|past/i.test(c.className || '')
    if (/^\d{1,2}$/.test(t) && !disabled) {
      const rect = c.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) { c.click(); return t }
    }
  }
  return null
})
console.log('clicked day:', dayClicked)
await page.waitForTimeout(5000)
await snap('2-date-clicked')
await dumpInteractive('after-date')

// Try to bump a participant stepper (any "+" button) and add an extra (any "Add" button).
const plus = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, [role="button"]'))
  const plusBtn = btns.find((b) => /^\+$/.test((b.innerText || '').trim()) || /increment|plus|increase/i.test(b.getAttribute('aria-label') || ''))
  if (plusBtn) { plusBtn.click(); return true }
  return false
})
console.log('clicked + :', plus)
await page.waitForTimeout(2500)

const addExtra = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, [role="button"]'))
  const add = btns.find((b) => /^add$/i.test((b.innerText || '').trim()))
  if (add) { add.click(); return true }
  return false
})
console.log('clicked Add (extra):', addExtra)
await page.waitForTimeout(3000)
await snap('3-participants-extra')

// Try to click a continue/checkout/book CTA.
const cta = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, [role="button"], a'))
  const c = btns.find((b) => /continue|checkout|book now|proceed|reserve|pay/i.test((b.innerText || '').trim()) && !(b.hasAttribute('disabled')))
  if (c) { c.click(); return (c.innerText || '').trim() }
  return null
})
console.log('clicked CTA:', cta)
await page.waitForTimeout(7000)
await snap('4-after-cta')
await dumpInteractive('after-cta')
console.log('URL after CTA:', page.url())

writeFileSync(path.join(OUT, 'cart-capture-network.json'), JSON.stringify(reqLog, null, 2))
writeFileSync(path.join(OUT, 'cart-capture-steps.json'), JSON.stringify({ url: URL, finalUrl: page.url(), dayClicked, plus, addExtra, cta, steps }, null, 2))
await browser.close()

console.log('\n=== /widgets/ shoppingCart POSTs captured ===')
for (const e of reqLog.filter((x) => x.phase === 'req' && /shoppingCart/.test(x.url) && x.method === 'POST')) {
  console.log(`POST ${e.url.slice(0, 150)}`)
  console.log('  body:', (e.postData || '').slice(0, 1200))
}
console.log('\n→ network:', path.relative(process.cwd(), path.join(OUT, 'cart-capture-network.json')))
