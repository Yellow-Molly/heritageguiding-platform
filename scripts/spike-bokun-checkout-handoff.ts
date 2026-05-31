/**
 * Phase 01 spike: discover Bokun's "our-selection → Bokun-hosted-payment" handoff
 * on the SANDBOX, before any UI/services are built.
 *
 * Decides the handoff path for the custom Tour Booking Panel:
 *   Plan B — reservation/cart → resume hosted checkout (PRIMARY; carries extras)
 *   Plan A — widget deep-link pre-fill (FALLBACK; cannot carry extras)
 *   Plan C — restyle the embedded widget (only if A+B both dead)
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/spike-bokun-checkout-handoff.ts \
 *     --mode=<discover|plan-a|endpoint-probe|cart|checkout-submit|all-reads> \
 *     [--experience-id=<sandboxId>] [--days=<N>] [--cart-uuid=<uuid>] [--extra-id=<id>]
 *
 * Modes:
 *   discover         READ-ONLY. Availability over the next --days + experience RATES/PRICING
 *                    components. Prints the first bookable slot (date/startTimeId/rate/
 *                    pricingCategory) + the channel UUID. Run this FIRST — it feeds the
 *                    flags the write modes need.
 *   plan-a           READ-ONLY (no network). Emits the widget deep-link checkout URL with
 *                    date/startTimeId/participants for browser pre-fill verification.
 *   endpoint-probe   Minimal-body hit on each candidate booking endpoint to record whether
 *                    it EXISTS (404 = gone) and what auth/validation it wants (401/400).
 *                    May create nothing or a throwaway draft — sandbox only.
 *   cart             WRITE. POST /cart.json/create → /cart.json/{uuid}/activity (+extra) →
 *                    GET cart → GET /checkout.json/options/shopping-cart/{uuid}.
 *   checkout-submit  WRITE. POST /checkout.json/submit with RESERVE_FOR_EXTERNAL_PAYMENT
 *                    (source=SHOPPING_CART via --cart-uuid, and source=DIRECT_REQUEST).
 *                    Scans the response for any resume/redirect/payment URL + confirmationCode.
 *   all-reads        discover + plan-a + endpoint-probe (no inventory-holding writes).
 *
 * Safety:
 *   - SANDBOX ONLY. Refuses to run when NODE_ENV=production (mirrors the extras spike).
 *     The HMAC client targets api.bokuntest.com whenever NODE_ENV !== 'production'.
 *   - All booking data is clearly labelled QA spike data. Reservations create real 30-min
 *     holds on the shared sandbox inventory — keep write runs minimal.
 *   - Raw responses (PII-redacted by Bokun's test data) saved for review; never commit creds.
 *
 * Output: plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/raw-output/
 */

import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import {
  BokunApiClient,
  BokunError,
} from '../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication'

type Mode =
  | 'list'
  | 'discover'
  | 'plan-a'
  | 'avail-probe'
  | 'endpoint-probe'
  | 'cart'
  | 'checkout-submit'
  | 'reserve'
  | 'all-reads'

interface Args {
  mode: Mode
  experienceId: string
  days: number
  cartUUID?: string
  extraId?: string
  date?: string
  startTimeId?: string
  participants: number
}

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  'plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/raw-output'
)

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined =>
    argv.find((a) => a.startsWith(`${flag}=`))?.split('=').slice(1).join('=')

  const mode = (get('--mode') ?? 'discover') as Mode
  const validModes: Mode[] = [
    'list',
    'discover',
    'plan-a',
    'avail-probe',
    'endpoint-probe',
    'cart',
    'checkout-submit',
    'reserve',
    'all-reads',
  ]
  if (!validModes.includes(mode)) {
    console.error(`ERROR: unknown --mode=${mode}. Valid: ${validModes.join(', ')}`)
    process.exit(2)
  }
  return {
    mode,
    // 24003 = sandbox experience used by the extras-write spike (precedent).
    experienceId: get('--experience-id') ?? '24003',
    days: Number(get('--days') ?? '90'),
    cartUUID: get('--cart-uuid'),
    extraId: get('--extra-id'),
    date: get('--date'),
    startTimeId: get('--start-time-id'),
    participants: Number(get('--participants') ?? '2'),
  }
}

function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function save(filename: string, data: unknown): string {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const file = path.join(OUTPUT_DIR, `${filename}-${ts()}.json`)
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  → saved: ${path.relative(process.cwd(), file)}`)
  return file
}

function preview(label: string, payload: unknown): void {
  console.log(`\n--- ${label} ---`)
  console.log(JSON.stringify(payload, null, 2).slice(0, 2500))
}

/**
 * Recursively collect any string that looks like a URL, plus any value whose KEY
 * hints at a redirect/payment/checkout link. This is how we detect a
 * "resume hosted checkout" URL on a reservation/cart response — the gating unknown.
 */
function scanForUrls(obj: unknown, pathStr = '$'): Array<{ path: string; value: string }> {
  const hits: Array<{ path: string; value: string }> = []
  const keyHint = /(url|uri|redirect|payment|checkout|link|href|pay)/i
  const walk = (node: unknown, p: string): void => {
    if (node == null) return
    if (typeof node === 'string') {
      if (/^https?:\/\//i.test(node)) hits.push({ path: p, value: node })
      return
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${p}[${i}]`))
      return
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        const childPath = `${p}.${k}`
        if (keyHint.test(k) && (typeof v === 'string' || typeof v === 'number')) {
          hits.push({ path: childPath, value: String(v) })
        }
        walk(v, childPath)
      }
    }
  }
  walk(obj, pathStr)
  // De-dup identical (path,value) pairs.
  const seen = new Set<string>()
  return hits.filter((h) => {
    const k = `${h.path}=${h.value}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Try a request; return a uniform result record (never throws). */
async function attempt(
  label: string,
  fn: () => Promise<unknown>
): Promise<{ label: string; ok: boolean; status?: number; errorCode?: string; body: unknown }> {
  try {
    const body = await fn()
    console.log(`  ✓ ${label} → 2xx`)
    return { label, ok: true, body }
  } catch (err) {
    if (err instanceof BokunError) {
      console.log(`  · ${label} → ${err.status} ${err.errorCode ?? ''} ${err.message.slice(0, 120)}`)
      return { label, ok: false, status: err.status, errorCode: err.errorCode, body: err.message }
    }
    console.log(`  · ${label} → threw ${String(err).slice(0, 120)}`)
    return { label, ok: false, body: String(err) }
  }
}

// ── Availability/rate shape used by discover + downstream write bodies ──
// This sandbox account exposes the OLD Bokun Booking API (/activity.json/...),
// not REST v2.0 /availabilities (which 404s here). We read slots from the old API.
interface DiscoveredSlot {
  dateEpoch: number
  date: string // YYYY-MM-DD
  startTime: string
  startTimeId: string
  availabilityCount: number
  unlimitedAvailability: boolean
  rateId?: number
  pricedPerPerson?: boolean
  rates: Array<{ ageBand?: string; price: string; currency: string; participantCount: number }>
}

interface OldApiSlot {
  date: number
  startTime: string
  startTimeId: number
  availabilityCount: number
  unlimited?: boolean
  rates?: Array<{ id: number; pricedPerPerson?: boolean }>
  pricesByCategory?: Record<string, unknown>
}

async function fetchAvailability(
  client: BokunApiClient,
  experienceId: string,
  days: number
): Promise<DiscoveredSlot[]> {
  const start = new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  const raw = await client.get<OldApiSlot[]>(
    `/activity.json/${encodeURIComponent(experienceId)}/availabilities?start=${start}&end=${end}`
  )
  return (raw ?? []).map((s) => ({
    dateEpoch: s.date,
    date: new Date(s.date).toISOString().slice(0, 10),
    startTime: s.startTime,
    startTimeId: String(s.startTimeId),
    availabilityCount: s.availabilityCount,
    unlimitedAvailability: Boolean(s.unlimited),
    rateId: s.rates?.[0]?.id,
    pricedPerPerson: s.rates?.[0]?.pricedPerPerson,
    rates: [],
  }))
}

/** Recursively pull plausible activity ids from a listing response. */
function extractActivityIds(obj: unknown): number[] {
  const ids = new Set<number>()
  const idKey = /^(id|activityId|productId|experienceId)$/i
  const walk = (node: unknown): void => {
    if (node == null || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(walk)
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (idKey.test(k) && (typeof v === 'number' || /^\d+$/.test(String(v)))) ids.add(Number(v))
      walk(v)
    }
  }
  walk(obj)
  return Array.from(ids)
}

// MODE: list — which activities can the CURRENT creds see? Probe candidate listing endpoints.
async function modeList(client: BokunApiClient): Promise<void> {
  console.log('[list] probing activity-listing endpoints visible to current sandbox creds')
  const probes: Array<{ label: string; fn: () => Promise<unknown> }> = [
    { label: 'POST /activity.json/search {}', fn: () => client.post('/activity.json/search', { page: 1, pageSize: 50 }) },
    { label: 'POST /restapi/v2.0/activity.json/search {}', fn: () => client.post('/restapi/v2.0/activity.json/search', { page: 1, pageSize: 50 }) },
    { label: 'POST /restapi/v2.0/search/product-list {}', fn: () => client.post('/restapi/v2.0/search/product-list', {}) },
    { label: 'GET /restapi/v2.0/booking-channel', fn: () => client.get('/restapi/v2.0/booking-channel') },
    { label: `GET /restapi/v2.0/booking-channel/${process.env.NEXT_PUBLIC_BOKUN_UUID}`, fn: () => client.get(`/restapi/v2.0/booking-channel/${process.env.NEXT_PUBLIC_BOKUN_UUID}`) },
    { label: 'POST /booking.json/activity-search {}', fn: () => client.post('/booking.json/activity-search', {}) },
  ]
  const results = []
  const allIds = new Set<number>()
  for (const p of probes) {
    const r = await attempt(p.label, p.fn)
    if (r.ok) extractActivityIds(r.body).forEach((id) => allIds.add(id))
    results.push(r)
  }
  save('list-activities', { results, candidateActivityIds: Array.from(allIds) })
  console.log(`\n  candidate activity ids discovered: ${Array.from(allIds).join(', ') || '(none)'}`)
  console.log('  → re-run discover with --experience-id=<one of these> to get a bookable slot.')
}

// MODE: discover — READ-ONLY availability + components.
async function modeDiscover(client: BokunApiClient, args: Args): Promise<DiscoveredSlot[]> {
  console.log(`[discover] experience=${args.experienceId} window=${args.days}d`)
  const availability = await attempt('GET /availabilities', () =>
    fetchAvailability(client, args.experienceId, args.days)
  )
  const slots = (availability.ok ? (availability.body as DiscoveredSlot[]) : []) ?? []

  // Per-age-band rate shape (#8): does rates[] carry per-band unit prices?
  const firstBookable = slots.find((s) => s.unlimitedAvailability || s.availabilityCount > 0)
  const rateShape = firstBookable?.rates?.map((r) => ({
    ageBand: r.ageBand ?? '(none)',
    price: r.price,
    currency: r.currency,
  }))

  // Experience pricing/rates components (pricingCategory ids needed by write bodies).
  const components: Record<string, unknown> = {}
  for (const ct of ['RATES', 'PRICING', 'BASIC'] as const) {
    const r = await attempt(`GET components?componentType=${ct}`, () =>
      client.get<unknown>(
        `/restapi/v2.0/experience/${encodeURIComponent(args.experienceId)}/components?componentType=${ct}`
      )
    )
    components[ct] = r.ok ? r.body : { error: r.body, status: r.status }
  }

  save('discover', {
    experienceId: args.experienceId,
    channelUUID: process.env.NEXT_PUBLIC_BOKUN_UUID ?? '(unset)',
    slotCount: slots.length,
    firstBookable: firstBookable ?? null,
    perAgeBandRateShape: rateShape ?? null,
    components,
  })

  console.log(`\n  slots: ${slots.length}`)
  if (firstBookable) {
    console.log(
      `  first bookable: date=${firstBookable.date} startTimeId=${firstBookable.startTimeId} time=${firstBookable.startTime} avail=${firstBookable.availabilityCount}`
    )
    preview('per-age-band rate shape (#8)', rateShape)
  } else {
    console.log('  ⚠ no bookable slots in window — try a wider --days or a different --experience-id')
  }
  console.log(`  channel UUID: ${process.env.NEXT_PUBLIC_BOKUN_UUID ?? '(unset)'}`)
  return slots
}

// MODE: plan-a — emit the widget deep-link checkout URL for browser pre-fill verification.
function modePlanA(args: Args, slots: DiscoveredSlot[]): void {
  const uuid = process.env.NEXT_PUBLIC_BOKUN_UUID
  const host = 'widgets.bokuntest.com' // sandbox; prod = widgets.bokun.io
  const slot = slots.find((s) => s.startTimeId === args.startTimeId) ?? slots[0]
  const date = args.date ?? slot?.date?.slice(0, 10)
  const startTimeId = args.startTimeId ?? slot?.startTimeId

  if (!uuid) {
    console.log('[plan-a] NEXT_PUBLIC_BOKUN_UUID unset — cannot build a channel URL.')
    return
  }
  const base = `https://${host}/online-sales/${uuid}/experience/${args.experienceId}`
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (startTimeId) params.set('startTimeId', String(startTimeId))
  if (args.participants) params.set('participants', String(args.participants))
  const withParams = `${base}?${params.toString()}&lang=en`

  console.log('\n[plan-a] Open BOTH in a browser. Does the param URL pre-select date/time/participants?')
  console.log(`  baseline (no params): ${base}?lang=en`)
  console.log(`  with params:          ${withParams}`)
  save('plan-a-urls', { base: `${base}?lang=en`, withParams, date, startTimeId, participants: args.participants })
}

// MODE: avail-probe — why does /availabilities 404? Probe detail + availability variants
// for one experience to find a bookable start-time/date (needed before a real reserve).
async function modeAvailProbe(client: BokunApiClient, args: Args): Promise<void> {
  const id = encodeURIComponent(args.experienceId)
  const start = new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + args.days * 86_400_000).toISOString().slice(0, 10)
  console.log(`[avail-probe] experience=${args.experienceId} window=${start}..${end}`)
  const probes: Array<{ label: string; fn: () => Promise<unknown> }> = [
    // --- what production code uses today (activity model) ---
    { label: 'GET /restapi/v2.0/activity/{id} (PROD CODE model)', fn: () => client.get(`/restapi/v2.0/activity/${id}`) },
    { label: 'GET /restapi/v2.0/activity/{id}/availabilities (PROD CODE path)', fn: () => client.get(`/restapi/v2.0/activity/${id}/availabilities?start=${start}&end=${end}&currency=SEK`) },
    // --- experience model (these IDs are "experiences", not "activities") ---
    { label: 'GET /restapi/v2.0/experience/{id}/availabilities', fn: () => client.get(`/restapi/v2.0/experience/${id}/availabilities?start=${start}&end=${end}&currency=SEK`) },
    { label: 'GET /restapi/v2.0/experience/{id}/availability', fn: () => client.get(`/restapi/v2.0/experience/${id}/availability?start=${start}&end=${end}&currency=SEK`) },
    { label: 'GET /restapi/v2.0/experience-availability/{id}', fn: () => client.get(`/restapi/v2.0/experience-availability/${id}?start=${start}&end=${end}&currency=SEK`) },
    { label: 'GET components?componentType=AVAILABILITY', fn: () => client.get(`/restapi/v2.0/experience/${id}/components?componentType=AVAILABILITY`) },
    { label: 'GET components?componentType=START_TIMES', fn: () => client.get(`/restapi/v2.0/experience/${id}/components?componentType=START_TIMES`) },
    // --- old Booking API (what this account actually serves) ---
    { label: 'GET /activity.json/{id} (old API detail)', fn: () => client.get(`/activity.json/${id}`) },
    { label: 'GET /activity.json/{id}/availabilities (old API)', fn: () => client.get(`/activity.json/${id}/availabilities?start=${start}&end=${end}`) },
  ]
  const results = []
  for (const p of probes) results.push(await attempt(p.label, p.fn))
  save(`avail-probe-${args.experienceId}`, results)
  // Surface anything that looks like a start-time id from a 2xx detail body.
  const detail = results.find((r) => r.ok && r.label.includes('activity/{id}'))
  if (detail?.ok) preview('activity detail (look for startTimes/schedule/bookable)', detail.body)
}

// MODE: endpoint-probe — does each candidate booking endpoint EXIST? (404 vs 400/401 vs 2xx)
async function modeEndpointProbe(client: BokunApiClient): Promise<void> {
  console.log('[endpoint-probe] existence/auth check on candidate handoff endpoints')
  const probes = [
    { label: 'POST /cart.json/create', fn: () => client.post('/cart.json/create', {}) },
    { label: 'GET /cart.json/create', fn: () => client.get('/cart.json/create') },
    {
      label: 'POST /checkout.json/submit (empty)',
      fn: () => client.post('/checkout.json/submit', {}),
    },
    {
      label: 'POST /checkout.json/options/booking-request (empty)',
      fn: () => client.post('/checkout.json/options/booking-request', {}),
    },
    {
      label: 'GET /checkout.json/options/shopping-cart/PROBE',
      fn: () => client.get('/checkout.json/options/shopping-cart/PROBE'),
    },
    {
      label: 'POST /booking.json/activity-availabilities (empty)',
      fn: () => client.post('/booking.json/activity-availabilities', {}),
    },
  ]
  const results = []
  for (const p of probes) results.push(await attempt(p.label, p.fn))
  save('endpoint-probe', results)
  console.log('\n  Read the statuses: 404 = endpoint gone; 400/401 = exists but needs body/auth; 2xx = exists.')
}

// MODE: cart — Plan B step 1-3 (create cart, add activity, get options).
async function modeCart(client: BokunApiClient, args: Args, slots: DiscoveredSlot[]): Promise<void> {
  console.log('[cart] Plan B: create cart → add activity → checkout options  (WRITES to sandbox)')
  const slot =
    slots.find((s) => s.startTimeId === args.startTimeId) ??
    slots.find((s) => s.unlimitedAvailability || s.availabilityCount > 0)
  if (!slot && !args.startTimeId) {
    console.log('  ⚠ no slot resolved — run discover first or pass --start-time-id/--date.')
  }
  const date = args.date ?? slot?.date?.slice(0, 10)
  const startTimeId = args.startTimeId ?? slot?.startTimeId

  // This account exposes the OLD Booking API: cart create is GET (POST 404s).
  const create = await attempt('GET /cart.json/create', () => client.get('/cart.json/create'))
  save('cart-create', create)
  const cb = (create.ok ? create.body : {}) as Record<string, unknown>
  const cartUUID =
    args.cartUUID ??
    (cb.cartUUID as string) ??
    (cb.uuid as string) ??
    (cb.id != null ? String(cb.id) : undefined) ??
    ((cb.cart as Record<string, unknown>)?.uuid as string)
  preview('cart-create body (look for uuid + any checkout/hosted URL)', cb)

  if (!cartUUID) {
    console.log('  ✗ no cartUUID — cannot continue cart flow. See cart-create output.')
    return
  }
  console.log(`  cartUUID=${cartUUID}`)

  // Add the activity. Bokun's exact body is undocumented; send the most-likely shape
  // (slot + pricing-category occupancy + optional extra). Errors are captured verbatim.
  const activityBody: Record<string, unknown> = {
    activityId: Number(args.experienceId),
    startTimeId: startTimeId ? Number(startTimeId) : undefined,
    date,
    pricingCategoryBookings: [
      { pricingCategoryId: undefined, occupancy: args.participants },
    ],
    ...(args.extraId
      ? { extras: [{ extraId: Number(args.extraId), unitCount: 1 }] }
      : {}),
  }
  const addItem = await attempt(`POST /cart.json/${cartUUID}/activity`, () =>
    client.post(`/cart.json/${cartUUID}/activity`, activityBody)
  )
  save('cart-add-activity', { sent: activityBody, result: addItem })

  const getCart = await attempt(`GET /cart.json/${cartUUID}`, () =>
    client.get(`/cart.json/${cartUUID}`)
  )
  save('cart-get', getCart)

  const options = await attempt(`GET /checkout.json/options/shopping-cart/${cartUUID}`, () =>
    client.get(`/checkout.json/options/shopping-cart/${cartUUID}`)
  )
  save('checkout-options', options)

  const urlHits = [
    ...scanForUrls(getCart.body, '$.cart'),
    ...scanForUrls(options.body, '$.options'),
  ]
  save('cart-url-scan', urlHits)
  preview('URL/redirect hits across cart + options (resume-URL hunt)', urlHits)
}

// MODE: checkout-submit — Plan B step 4: reserve for external payment; hunt the resume URL.
async function modeCheckoutSubmit(
  client: BokunApiClient,
  args: Args,
  slots: DiscoveredSlot[]
): Promise<void> {
  console.log('[checkout-submit] RESERVE_FOR_EXTERNAL_PAYMENT  (WRITES — creates a 30-min hold)')
  const slot =
    slots.find((s) => s.startTimeId === args.startTimeId) ??
    slots.find((s) => s.unlimitedAvailability || s.availabilityCount > 0)
  const date = args.date ?? slot?.date?.slice(0, 10)
  const startTimeId = args.startTimeId ?? slot?.startTimeId

  // Variant 1: source=SHOPPING_CART (needs --cart-uuid from the `cart` mode).
  if (args.cartUUID) {
    const body = {
      checkoutOption: 'RESERVE_FOR_EXTERNAL_PAYMENT',
      paymentMethod: 'RESERVE_FOR_EXTERNAL_PAYMENT',
      source: 'SHOPPING_CART',
      cartUUID: args.cartUUID,
    }
    const r = await attempt('POST /checkout.json/submit (SHOPPING_CART)', () =>
      client.post('/checkout.json/submit', body)
    )
    save('checkout-submit-cart', { sent: body, result: r })
    preview('resume/redirect URL hunt (cart submit)', scanForUrls(r.body, '$.submit'))
  } else {
    console.log('  · skipping SHOPPING_CART variant (no --cart-uuid). Run `cart` mode first.')
  }

  // Variant 2: source=DIRECT_REQUEST with an inline booking request (no pre-made cart).
  const directBody: Record<string, unknown> = {
    checkoutOption: 'RESERVE_FOR_EXTERNAL_PAYMENT',
    paymentMethod: 'RESERVE_FOR_EXTERNAL_PAYMENT',
    source: 'DIRECT_REQUEST',
    // Idempotency-token probe (#13): include a client token; note in findings if echoed/honored.
    clientReference: `qa-spike-${ts()}`,
    bookingRequest: {
      activityBookings: [
        {
          activityId: Number(args.experienceId),
          startTimeId: startTimeId ? Number(startTimeId) : undefined,
          date,
          pricingCategoryBookings: [{ occupancy: args.participants }],
          ...(args.extraId ? { extras: [{ extraId: Number(args.extraId), unitCount: 1 }] } : {}),
        },
      ],
    },
  }
  const direct = await attempt('POST /checkout.json/submit (DIRECT_REQUEST)', () =>
    client.post('/checkout.json/submit', directBody)
  )
  save('checkout-submit-direct', { sent: directBody, result: direct })

  const submitUrls = scanForUrls(direct.body, '$.directSubmit')
  save('checkout-submit-url-scan', submitUrls)
  preview('resume/redirect URL hunt (direct submit)', submitUrls)

  if (direct.ok) {
    const b = (direct.body as Record<string, unknown>)?.booking as Record<string, unknown> | undefined
    console.log('\n  reservation summary:')
    console.log(`    status=${b?.status} confirmationCode=${b?.confirmationCode} totalDue=${b?.totalDue}`)
    console.log(`    → if a resume/payment URL appears above, Plan B is alive. If not, Plan B handoff is unproven.`)
  }
}

// Build the old-Booking-API booking request for one activity slot.
// Per-group: one "Per group" pricing-category line. Extras attached if --extra-id given.
function buildBookingRequest(
  args: Args,
  slot: DiscoveredSlot,
  pricingCategoryId: number
): Record<string, unknown> {
  return {
    activityBookings: [
      {
        activityId: Number(args.experienceId),
        rateId: slot.rateId,
        startTimeId: Number(slot.startTimeId),
        date: slot.dateEpoch,
        pricingCategoryBookings: [
          { pricingCategoryId, quantity: 1, occupancy: args.participants },
        ],
        ...(args.extraId
          ? { extras: [{ extra: { id: Number(args.extraId) }, unitCount: 1 }] }
          : {}),
      },
    ],
  }
}

// MODE: reserve — Plan B end-to-end: options → submit RESERVE_FOR_EXTERNAL_PAYMENT → URL hunt.
async function modeReserve(client: BokunApiClient, args: Args, slots: DiscoveredSlot[]): Promise<void> {
  const slot =
    slots.find((s) => s.startTimeId === args.startTimeId) ??
    slots.find((s) => s.availabilityCount > 0 || s.unlimitedAvailability)
  if (!slot) {
    console.log('  ✗ no bookable slot found — cannot reserve.')
    return
  }
  // Default "Per group" pricing category for the per-group flat experience (24010 → 30079).
  const pricingCategoryId = Number(args.extraId ? 30079 : 30079)
  console.log(
    `[reserve] slot date=${slot.date} startTimeId=${slot.startTimeId} rateId=${slot.rateId} participants=${args.participants}`
  )
  const bookingRequest = buildBookingRequest(args, slot, pricingCategoryId)

  // 1) Payment options for this booking request — non-reserving; reveals available
  //    payment methods (does RESERVE_FOR_EXTERNAL_PAYMENT appear?) + a validated total.
  const options = await attempt('POST /checkout.json/options/booking-request', () =>
    client.post('/checkout.json/options/booking-request', { bookingRequest })
  )
  save('reserve-options', { sent: { bookingRequest }, result: options })
  preview('payment options (look for RESERVE_FOR_EXTERNAL_PAYMENT + totals)', options.body)

  // 2) Submit the reservation. clientReference probes idempotency-token support (#13).
  const submitBody = {
    bookingRequest,
    checkoutOption: 'RESERVE_FOR_EXTERNAL_PAYMENT',
    paymentMethod: 'RESERVE_FOR_EXTERNAL_PAYMENT',
    source: 'DIRECT_REQUEST',
    clientReference: `qa-spike-${ts()}`,
  }
  const submit = await attempt('POST /checkout.json/submit (RESERVE_FOR_EXTERNAL_PAYMENT)', () =>
    client.post('/checkout.json/submit', submitBody)
  )
  save('reserve-submit', { sent: submitBody, result: submit })

  const urls = scanForUrls(submit.body, '$.submit')
  save('reserve-url-scan', urls)
  preview('RESUME/REDIRECT/PAYMENT URL hunt (the gating unknown)', urls)

  if (submit.ok) {
    const b = (submit.body as Record<string, unknown>)?.booking as Record<string, unknown> | undefined
    console.log('\n  reservation summary:')
    console.log(`    status=${b?.status} confirmationCode=${b?.confirmationCode} totalDue=${b?.totalDue} totalPrice=${b?.totalPrice}`)
    console.log(urls.length ? '    → URL(s) found above — inspect for a hosted-payment resume link.' : '    → NO url in response: Plan B resume-URL unproven via submit response.')
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  if (!process.env.BOKUN_API_KEY || !process.env.BOKUN_SECRET_KEY) {
    console.error('ERROR: BOKUN_API_KEY / BOKUN_SECRET_KEY missing. Use --require ./scripts/patch-next-env.cjs')
    process.exit(2)
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: NODE_ENV=production — refusing to run a sandbox write-spike against prod Bokun.')
    process.exit(2)
  }

  const client = new BokunApiClient()
  console.log(`Sandbox: api.bokuntest.com | mode: ${args.mode} | experience: ${args.experienceId}\n`)

  try {
    let slots: DiscoveredSlot[] = []
    if (args.mode === 'list') await modeList(client)
    if (args.mode === 'discover' || args.mode === 'all-reads') slots = await modeDiscover(client, args)
    if (args.mode === 'plan-a' || args.mode === 'all-reads') {
      if (slots.length === 0) slots = await modeDiscover(client, args)
      modePlanA(args, slots)
    }
    if (args.mode === 'avail-probe') await modeAvailProbe(client, args)
    if (args.mode === 'endpoint-probe' || args.mode === 'all-reads') await modeEndpointProbe(client)
    if (args.mode === 'cart') {
      slots = await modeDiscover(client, args)
      await modeCart(client, args, slots)
    }
    if (args.mode === 'checkout-submit') {
      slots = await modeDiscover(client, args)
      await modeCheckoutSubmit(client, args, slots)
    }
    if (args.mode === 'reserve') {
      slots = await modeDiscover(client, args)
      await modeReserve(client, args, slots)
    }
    console.log(`\n✓ done. raw output: ${path.relative(process.cwd(), OUTPUT_DIR)}`)
  } catch (err) {
    if (err instanceof BokunError) {
      console.error(`\n✗ BokunError ${err.status} ${err.errorCode ?? ''}: ${err.message}`)
    } else {
      console.error('\n✗ Spike failed:', err)
    }
    process.exit(1)
  }
}

main()
