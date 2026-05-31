/**
 * Phase 01 spike (Plan A verification): load the Bokun SANDBOX widget deep-link and
 * observe whether date / startTimeId / participants pre-select, and what API the widget
 * calls (does it reach a Bokun-hosted payment step?).
 *
 * Placed in e2e/ so `import 'playwright'` resolves against e2e/node_modules.
 * Run: node e2e/spike-bokun-widget-prefill.mjs
 *
 * Read-only: only loads a public widget URL. No bookings created.
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
const HOST = 'widgets.bokuntest.com'
const EXP = '24010'
const DATE = '2026-06-01'
const START_TIME_ID = '48301'
const PARTICIPANTS = '2'

const base = `https://${HOST}/online-sales/${UUID}/experience/${EXP}?lang=en`
const withParams = `https://${HOST}/online-sales/${UUID}/experience/${EXP}?date=${DATE}&startTimeId=${START_TIME_ID}&participants=${PARTICIPANTS}&lang=en`

async function loadAndObserve(browser, label, url) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } })
  const page = await ctx.newPage()
  const apiCalls = []
  page.on('request', (r) => {
    const u = r.url()
    if (/bokun/.test(u) && /(checkout|cart|availab|booking|payment|experience)/i.test(u)) {
      apiCalls.push(`${r.method()} ${u.slice(0, 180)}`)
    }
  })
  const consoleErrs = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 160))
  })

  let httpStatus = null
  page.on('response', (resp) => {
    if (resp.url() === url) httpStatus = resp.status()
  })

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => {
    consoleErrs.push('goto: ' + String(e).slice(0, 160))
  })
  // Widget loads async; give it time to render the calendar/selection.
  await page.waitForTimeout(9000)

  // Gather visible text from the top doc + all frames (widget may be a frame).
  const texts = []
  for (const frame of page.frames()) {
    try {
      const t = await frame.evaluate(() => document.body?.innerText || '')
      if (t && t.trim()) texts.push(t.replace(/\s+/g, ' ').trim().slice(0, 1200))
    } catch {}
  }
  const combined = texts.join('  ||FRAME||  ')

  const shotPath = path.join(OUT, `widget-${label}.png`)
  await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {})

  await ctx.close()
  return {
    label,
    url,
    httpStatus,
    title: combined.slice(0, 120),
    apiCalls: [...new Set(apiCalls)].slice(0, 25),
    consoleErrs: [...new Set(consoleErrs)].slice(0, 10),
    visibleTextSample: combined.slice(0, 1000),
    // Heuristic pre-fill signals.
    mentionsDate: /jun|june|01\.06|2026-06-01|1 jun/i.test(combined),
    mentionsParticipants2: /\b2\b/.test(combined),
    hasPayWord: /(pay|card|checkout|secure|payment|continue)/i.test(combined),
    screenshot: path.relative(process.cwd(), shotPath),
  }
}

const browser = await chromium.launch({ headless: true })
const results = []
results.push(await loadAndObserve(browser, 'baseline-no-params', base))
results.push(await loadAndObserve(browser, 'with-params', withParams))
await browser.close()

writeFileSync(
  path.join(OUT, 'widget-prefill-report.json'),
  JSON.stringify({ base, withParams, results }, null, 2),
  'utf-8'
)
for (const r of results) {
  console.log(`\n=== ${r.label} (HTTP ${r.httpStatus}) ===`)
  console.log('screenshot:', r.screenshot)
  console.log('apiCalls:', r.apiCalls.length ? r.apiCalls.join('\n          ') : '(none captured)')
  console.log('consoleErrs:', r.consoleErrs.join(' | ') || '(none)')
  console.log('visibleText:', r.visibleTextSample.slice(0, 600))
}
console.log('\n→ report:', path.relative(process.cwd(), path.join(OUT, 'widget-prefill-report.json')))
