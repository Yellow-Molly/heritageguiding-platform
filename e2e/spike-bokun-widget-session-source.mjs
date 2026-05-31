/**
 * Phase 01 Plan B' spike (session-source pass): can the widget's shoppingCart sessionId
 * be CONTROLLED? If not (fresh per load, ignores injection), in-widget resume is impossible
 * and Plan B' is dead.
 *
 * Tests: (1) ?sessionId= on the URL, (2) where the live sessionId is stored
 * (localStorage / cookie), (3) pre-setting localStorage then reload.
 *
 * Run: node e2e/spike-bokun-widget-session-source.mjs   (read-only)
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

const OUT = path.resolve(process.cwd(), 'plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/raw-output')
mkdirSync(OUT, { recursive: true })
const UUID = '11917131-ac6a-45e1-8e99-bd0cf1e318c8'
const EXP = '24010'
const ORIGIN = 'https://widgets.bokuntest.com'

function sessionIdsFromTraffic(reqs) {
  const ids = new Set()
  for (const u of reqs) {
    const m = u.match(/[?&]sessionId=([^&]+)/)
    if (m) ids.add(decodeURIComponent(m[1]))
  }
  return Array.from(ids)
}

async function loadAndCapture(ctx, url, { presetLocalStorage } = {}) {
  const page = await ctx.newPage()
  const widgetReqs = []
  page.on('request', (r) => { if (/\/widgets\//.test(r.url())) widgetReqs.push(r.url()) })
  if (presetLocalStorage) {
    await page.addInitScript((kv) => {
      for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v)
    }, presetLocalStorage)
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
  await page.waitForTimeout(6000)
  const storage = await page.evaluate(() => {
    const ls = {}
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = (localStorage.getItem(k) || '').slice(0, 120) }
    return { localStorage: ls }
  }).catch(() => ({ localStorage: {} }))
  const cookies = await ctx.cookies()
  const sessionIds = sessionIdsFromTraffic(widgetReqs)
  await page.close()
  return { url, sessionIds, localStorage: storage.localStorage, cookies: cookies.map((c) => `${c.name}=${String(c.value).slice(0, 40)}`) }
}

const browser = await chromium.launch({ headless: true })
const report = {}

// Test 1: inject ?sessionId= on the online-sales URL.
{
  const ctx = await browser.newContext()
  const INJECT = 'spike-resume-aaaa-1111'
  report.test1_urlParam = await loadAndCapture(ctx, `${ORIGIN}/online-sales/${UUID}/experience/${EXP}?lang=en&sessionId=${INJECT}`)
  report.test1_urlParam.injected = INJECT
  report.test1_urlParam.honored = report.test1_urlParam.sessionIds.includes(INJECT)
  await ctx.close()
}

// Test 2: where does the live sessionId live? (localStorage / cookie keys)
{
  const ctx = await browser.newContext()
  report.test2_storage = await loadAndCapture(ctx, `${ORIGIN}/online-sales/${UUID}/experience/${EXP}?lang=en`)
  await ctx.close()
}

// Test 3: preset likely localStorage keys to a known sessionId, then load (no URL param).
{
  const ctx = await browser.newContext()
  const PRESET = 'spike-resume-bbbb-2222'
  // Seed several plausible key names; we'll see which (if any) the widget reuses.
  const preset = { sessionId: PRESET, 'bokun.sessionId': PRESET, 'bokun_session_id': PRESET, 'octo.sessionId': PRESET }
  report.test3_localStoragePreset = await loadAndCapture(ctx, `${ORIGIN}/online-sales/${UUID}/experience/${EXP}?lang=en`, { presetLocalStorage: preset })
  report.test3_localStoragePreset.preset = PRESET
  report.test3_localStoragePreset.honored = report.test3_localStoragePreset.sessionIds.includes(PRESET)
  await ctx.close()
}

await browser.close()
writeFileSync(path.join(OUT, 'widget-session-source-report.json'), JSON.stringify(report, null, 2))

console.log('=== Test 1: ?sessionId= URL param ===')
console.log('  injected:', report.test1_urlParam.injected, '| honored:', report.test1_urlParam.honored)
console.log('  sessionIds seen in traffic:', report.test1_urlParam.sessionIds.join(', ') || '(none)')
console.log('\n=== Test 2: storage on a normal load ===')
console.log('  localStorage keys:', Object.keys(report.test2_storage.localStorage).join(', ') || '(none)')
console.log('  localStorage (truncated):', JSON.stringify(report.test2_storage.localStorage).slice(0, 500))
console.log('  cookies:', report.test2_storage.cookies.join(', ') || '(none)')
console.log('  sessionIds seen:', report.test2_storage.sessionIds.join(', '))
console.log('\n=== Test 3: preset localStorage then reload ===')
console.log('  preset:', report.test3_localStoragePreset.preset, '| honored:', report.test3_localStoragePreset.honored)
console.log('  sessionIds seen:', report.test3_localStoragePreset.sessionIds.join(', '))
console.log('\n→ report: plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/raw-output/widget-session-source-report.json')
