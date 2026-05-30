/**
 * Phase 01 spike: probe Bokun's extras write API against the sandbox.
 *
 * Answers the 6 open questions in:
 *   plans/260525-1417-bokun-extras-push-sync/phase-01-bokun-sandbox-spike-verify-extras-write-api.md
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/spike-bokun-extras-write-api.ts \
 *     --experience-id=<sandboxId> --mode=<read|probe-externalid|probe-empty|probe-required|all>
 *
 * Modes (run individually to keep findings reviewable):
 *   read              GET experience; dump extras + pricingRules to raw-output/
 *   probe-externalid  PUT components adding a NEW extra with externalId="cms-spike-<ts>".
 *                     GET back; report whether Bokun preserved externalId (round-trip).
 *   probe-empty       PUT components with extras:[] (DESTRUCTIVE — sandbox only).
 *                     GET back; capture which other components (pricingRules, rates) were
 *                     touched. Use this on a throwaway tour only.
 *   probe-required    PUT three extras with different combinations of `required: true`,
 *                     `included: true`, etc. GET back; identify which field actually
 *                     controls the dashboard "Required" toggle.
 *   all               read → externalid → required → empty. Stops at first non-2xx.
 *
 * Output: plans/260525-1417-bokun-extras-push-sync/research/raw-output/<mode>-<ts>.json
 * Hits `api.bokuntest.com` because NODE_ENV !== 'production' inside the client.
 */

import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import {
  BokunApiClient,
  BokunError,
} from '../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication'

type ProbeMode =
  | 'read'
  | 'probe-externalid'
  | 'probe-empty'
  | 'probe-required'
  | 'probe-pricing'
  | 'probe-pricing-deep'
  | 'all'

interface Args {
  experienceId: string
  mode: ProbeMode
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined =>
    argv.find((a) => a.startsWith(`${flag}=`))?.split('=')[1]

  const experienceId = get('--experience-id')
  const mode = (get('--mode') ?? 'read') as ProbeMode

  if (!experienceId) {
    console.error('ERROR: --experience-id=<sandbox tour ID> is required.')
    process.exit(2)
  }
  if (
    ![
      'read',
      'probe-externalid',
      'probe-empty',
      'probe-required',
      'probe-pricing',
      'probe-pricing-deep',
      'all',
    ].includes(mode)
  ) {
    console.error(`ERROR: unknown --mode=${mode}`)
    process.exit(2)
  }
  return { experienceId, mode }
}

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  'plans/260525-1417-bokun-extras-push-sync/research/raw-output'
)

function ensureOutputDir(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function save(filename: string, data: unknown): string {
  const file = path.join(OUTPUT_DIR, filename)
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
  return file
}

function safeLog(label: string, payload: unknown): void {
  console.log(`\n--- ${label} ---`)
  console.log(JSON.stringify(payload, null, 2).slice(0, 4000))
}

// Component types Bokun documents for the components endpoint. We probe each one
// individually because GET requires componentType= per probe response message.
const COMPONENT_TYPES = [
  'BASIC',
  'EXTRAS',
  'PRICING',
  'RATES',
  'TRANSLATIONS',
] as const

// Helper: GET experience components. Bokun requires `componentType=<X>` per read.
// Returns a merged shape { [componentType]: body } so the rest of the spike can
// keep treating `.extras` / `.pricing` as object keys.
async function readExperience(
  client: BokunApiClient,
  experienceId: string,
  tag: string
): Promise<Record<string, unknown>> {
  const id = encodeURIComponent(experienceId)
  const merged: Record<string, unknown> = {}
  const errors: Array<{ componentType: string; error: string }> = []

  for (const componentType of COMPONENT_TYPES) {
    const endpoint = `/restapi/v2.0/experience/${id}/components?componentType=${componentType}`
    try {
      const body = await client.get<unknown>(endpoint)
      merged[componentType] = body
      console.log(`  ✓ GET ${componentType.padEnd(13)} (200)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 100) : String(err)
      errors.push({ componentType, error: msg })
      console.log(`  · GET ${componentType.padEnd(13)} → ${msg}`)
    }
  }

  const file = save(`read-${tag}-${ts()}.json`, { components: merged, errors })
  console.log(`  → saved: ${file}`)
  // Surface extras + pricing at top level for downstream probes that read them.
  return {
    ...merged,
    extras: (merged.EXTRAS as Record<string, unknown> | undefined)?.extras ?? merged.EXTRAS,
    pricing: merged.PRICING,
    rates: merged.RATES,
  }
}

// Helper: PUT raw components body. Bypasses serializeBokunExperiencePayload
// so the probe controls the exact wire shape sent.
async function putComponents(
  client: BokunApiClient,
  experienceId: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const endpoint = `/restapi/v2.0/experience/${encodeURIComponent(experienceId)}/components`
  return client.put<unknown>(endpoint, body)
}

// MODE: read — pure GET, no writes.
async function modeRead(client: BokunApiClient, experienceId: string): Promise<void> {
  console.log(`[read] GET /experience/${experienceId}`)
  const body = await readExperience(client, experienceId, 'baseline')
  // Surface the bits the spike actually cares about for at-a-glance review.
  const probe = body as Record<string, unknown>
  safeLog('extras', probe.extras ?? '(none on root)')
  safeLog('pricing', probe.pricing ?? probe.pricingRules ?? '(none on root)')
  safeLog('rates', probe.rates ?? '(none on root)')
}

// MODE: probe-externalid — add a new extra with externalId; GET; verify round-trip.
async function modeProbeExternalId(
  client: BokunApiClient,
  experienceId: string
): Promise<void> {
  const externalId = `cms-spike-${Date.now()}`
  const newExtra = {
    externalId,
    title: `Spike Probe ${ts()}`,
    description: 'externalId round-trip probe — safe to delete',
    maxPerBooking: 5,
    limitByPax: false,
  }

  console.log(`[probe-externalid] PUT components with extra.externalId="${externalId}"`)
  console.log('  ⚠️  Note: this sends extras: [<new>] which by full-replacement semantics')
  console.log('     would DELETE any existing extras on this tour. Use throwaway tour only.')

  const putResp = await putComponents(client, experienceId, { extras: [newExtra] })
  save(`probe-externalid-put-response-${ts()}.json`, putResp ?? '(empty body)')

  console.log('  → PUT returned; reading back...')
  const after = await readExperience(client, experienceId, 'after-externalid')

  const extras = ((after as Record<string, unknown>).extras ?? []) as Array<Record<string, unknown>>
  const match = extras.find((e) => e.externalId === externalId)
  console.log(
    match
      ? `  ✓ externalId round-tripped. Bokun-assigned id=${match.id}, externalId=${match.externalId}`
      : '  ✗ externalId NOT preserved by Bokun. Will need position-based correlation in Phase 04.'
  )
  save(`probe-externalid-verdict-${ts()}.json`, {
    sent: { externalId, title: newExtra.title },
    received: match ?? null,
    verdict: match ? 'externalId preserved' : 'externalId NOT preserved',
  })
}

// MODE: probe-empty — PUT extras:[] (DESTRUCTIVE) — capture pricing side-effects.
async function modeProbeEmpty(client: BokunApiClient, experienceId: string): Promise<void> {
  console.log('[probe-empty] capturing baseline BEFORE destructive PUT...')
  const before = await readExperience(client, experienceId, 'before-empty')
  const beforeRec = before as Record<string, unknown>

  console.log('[probe-empty] PUT components with extras: []  (DESTRUCTIVE)')
  const putResp = await putComponents(client, experienceId, { extras: [] })
  save(`probe-empty-put-response-${ts()}.json`, putResp ?? '(empty body)')

  console.log('  → reading back; checking side effects on pricing/rates...')
  const after = await readExperience(client, experienceId, 'after-empty')
  const afterRec = after as Record<string, unknown>

  const verdict = {
    extras_before_count: Array.isArray(beforeRec.extras) ? (beforeRec.extras as unknown[]).length : 0,
    extras_after_count: Array.isArray(afterRec.extras) ? (afterRec.extras as unknown[]).length : 0,
    pricing_before: beforeRec.pricing ?? beforeRec.pricingRules ?? null,
    pricing_after: afterRec.pricing ?? afterRec.pricingRules ?? null,
    rates_before: beforeRec.rates ?? null,
    rates_after: afterRec.rates ?? null,
  }
  save(`probe-empty-verdict-${ts()}.json`, verdict)
  console.log(
    `  → extras count ${verdict.extras_before_count} → ${verdict.extras_after_count}`
  )
  console.log('  → see verdict file for pricing/rates comparison')
}

// MODE: probe-required — figure out which field controls dashboard "Required".
async function modeProbeRequired(
  client: BokunApiClient,
  experienceId: string
): Promise<void> {
  console.log('[probe-required] sending 3 extras with different required/included combos')
  const stamp = Date.now()
  const extras = [
    {
      externalId: `req-A-${stamp}`,
      title: 'Required Probe A — required:true',
      required: true,
      maxPerBooking: 1,
    },
    {
      externalId: `req-B-${stamp}`,
      title: 'Required Probe B — included:true',
      included: true,
      maxPerBooking: 1,
    },
    {
      externalId: `req-C-${stamp}`,
      title: 'Required Probe C — neither flag',
      maxPerBooking: 1,
    },
  ]
  console.log(
    '  ⚠️  Full-replacement: this overwrites the tour\'s current extras with these 3.'
  )
  const putResp = await putComponents(client, experienceId, { extras })
  save(`probe-required-put-response-${ts()}.json`, putResp ?? '(empty body)')

  const after = await readExperience(client, experienceId, 'after-required')
  const got = ((after as Record<string, unknown>).extras ?? []) as Array<Record<string, unknown>>

  const verdict = extras.map((sent) => {
    const back = got.find((g) => g.externalId === sent.externalId)
    return {
      externalId: sent.externalId,
      sent_keys: Object.keys(sent),
      received_required: back?.required,
      received_included: back?.included,
      received_id: back?.id,
    }
  })
  save(`probe-required-verdict-${ts()}.json`, verdict)
  console.table(verdict)
  console.log('  → Inspect Bokun dashboard for each probe; note which shows "Required" toggle ON.')
}

// MODE: probe-pricing — verify (a) we can PUT extras+pricing in one call and
// (b) extra pricing rules don't wipe the tour-level rate. Hard-coded to use
// the rate/pricingCategory IDs observed in baseline GET for experience 24003.
async function modeProbePricing(
  client: BokunApiClient,
  experienceId: string,
  rateId: number,
  pricingCategoryId: number
): Promise<void> {
  // ExtraPriceRuleDto requires `extra: { id }` — externalId is NOT a valid key on
  // pricing rules. Use the spike extra id (5378) created by probe-externalid.
  // (Falls back: caller can override via env if a different id is currently on the tour.)
  const targetExtraId = Number(process.env.SPIKE_EXTRA_ID ?? '5378')
  const body = {
    pricing: {
      // Send ONLY extraPriceRules. Test whether Bokun preserves experiencePriceRules
      // (the tour rate) when we touch just one sub-array.
      extraPriceRules: [
        {
          extra: { id: targetExtraId },
          rate: { id: rateId },
          currency: 'SEK',
          amount: '125.00',
          pricingCategoryId,
        },
      ],
    },
  }

  console.log(
    `[probe-pricing] PUT pricing.extraPriceRules for extra=${targetExtraId}, rate=${rateId}`
  )
  console.log('  → test: does this preserve experiencePriceRules (tour rate)?')
  const putResp = await putComponents(client, experienceId, body)
  save(`probe-pricing-put-response-${ts()}.json`, putResp ?? '(empty body)')

  const after = await readExperience(client, experienceId, 'after-pricing')
  const pricing = (after.PRICING ?? after.pricing) as Record<string, unknown>
  const pricingInner = (pricing?.pricing ?? pricing) as Record<string, unknown>
  const extras = ((after as Record<string, unknown>).extras ?? []) as Array<Record<string, unknown>>

  const newExtra = extras.find((e) => e.externalId === externalId)
  const verdict = {
    sent_extra_externalId: externalId,
    received_extra: newExtra ?? null,
    experiencePriceRules_after: pricingInner?.experiencePriceRules ?? null,
    extraPriceRules_after: pricingInner?.extraPriceRules ?? null,
    preservation_check: {
      tour_rate_preserved:
        Array.isArray(pricingInner?.experiencePriceRules) &&
        (pricingInner.experiencePriceRules as unknown[]).length > 0,
      extra_pricing_applied:
        Array.isArray(pricingInner?.extraPriceRules) &&
        (pricingInner.extraPriceRules as unknown[]).length > 0,
    },
  }
  save(`probe-pricing-verdict-${ts()}.json`, verdict)
  console.log(`  tour rate preserved: ${verdict.preservation_check.tour_rate_preserved}`)
  console.log(`  extra pricing applied: ${verdict.preservation_check.extra_pricing_applied}`)
}

// MODE: probe-pricing-deep — exhaustively try every plausible pricing-write
// variation against an extra we just created. Reports which (if any) works.
async function modeProbePricingDeep(
  client: BokunApiClient,
  experienceId: string,
  rateId: number,
  pricingCategoryId: number,
  priceCatalogId: number,
  existingExperiencePriceRules: unknown[]
): Promise<void> {
  // Step 1: create a fresh extra. PUT response gives us the new id immediately.
  const externalId = `pricing-deep-${Date.now()}`
  console.log(`[probe-pricing-deep] creating fresh extra (externalId=${externalId})...`)
  const created = (await putComponents(client, experienceId, {
    extras: [
      {
        externalId,
        title: 'Pricing Deep Probe',
        description: 'fresh extra to attach pricing to',
        type: 'OTHERS',
        maxPerBooking: 5,
        limitByPax: false,
      },
    ],
  })) as Record<string, unknown>
  const extras = (created.extras ?? []) as Array<Record<string, unknown>>
  const fresh = extras.find((e) => e.externalId === externalId)
  if (!fresh?.id) {
    console.error('  ✗ Could not extract new extra id from PUT response.')
    save(`probe-pricing-deep-step1-${ts()}.json`, created)
    return
  }
  const newExtraId = fresh.id as number
  console.log(`  ✓ extra id=${newExtraId}`)

  const pricingRule = {
    extra: { id: newExtraId },
    rate: { id: rateId },
    currency: 'SEK',
    amount: '125.00',
    pricingCategoryId,
    priceCatalogId,
  }

  // Build the 4 variants. Each is a (label, fn) tuple — first 2xx wins.
  const variants: Array<{ label: string; fn: () => Promise<unknown> }> = [
    {
      label: 'V1: PUT /components?componentType=PRICING with {pricing:{extraPriceRules:[rule]}}',
      fn: () =>
        client.put<unknown>(
          `/restapi/v2.0/experience/${encodeURIComponent(experienceId)}/components?componentType=PRICING`,
          { pricing: { extraPriceRules: [pricingRule] } }
        ),
    },
    {
      label:
        'V2: PUT /components with FULL pricing echo (preserves experiencePriceRules + adds extraPriceRule)',
      fn: () =>
        putComponents(client, experienceId, {
          pricing: {
            experiencePriceRules: existingExperiencePriceRules,
            extraPriceRules: [pricingRule],
            pickupPriceRules: [],
            dropoffPriceRules: [],
          },
        }),
    },
    {
      label: 'V3: PUT /experience/{id}/pricing with {extraPriceRules:[rule]}',
      fn: () =>
        client.put<unknown>(
          `/restapi/v2.0/experience/${encodeURIComponent(experienceId)}/pricing`,
          { extraPriceRules: [pricingRule] }
        ),
    },
    {
      label: 'V4: PUT /experience/{id}/components/pricing with {extraPriceRules:[rule]}',
      fn: () =>
        client.put<unknown>(
          `/restapi/v2.0/experience/${encodeURIComponent(experienceId)}/components/pricing`,
          { extraPriceRules: [pricingRule] }
        ),
    },
  ]

  const results: Array<{
    variant: string
    status: 'ok' | 'error'
    error?: string
    response?: unknown
  }> = []

  for (const v of variants) {
    console.log(`\n  • ${v.label}`)
    try {
      const resp = await v.fn()
      console.log('    ✓ 2xx OK')
      results.push({ variant: v.label, status: 'ok', response: resp })
      // First success: capture state and stop further mutations.
      const after = await readExperience(client, experienceId, 'after-pricing-deep-win')
      save(`probe-pricing-deep-winner-${ts()}.json`, {
        winner: v.label,
        put_response: resp,
        post_state: after,
      })
      return
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 400) : String(err)
      console.log(`    ✗ ${msg.slice(0, 200)}`)
      results.push({ variant: v.label, status: 'error', error: msg })
    }
  }

  save(`probe-pricing-deep-all-failed-${ts()}.json`, { extra_id: newExtraId, results })
  console.log('\n  ✗ All 4 variants failed. Verdict file saved.')
}

async function main(): Promise<void> {
  const { experienceId, mode } = parseArgs(process.argv.slice(2))
  if (!process.env.BOKUN_API_KEY || !process.env.BOKUN_SECRET_KEY) {
    console.error(
      'ERROR: BOKUN_API_KEY / BOKUN_SECRET_KEY missing. Use --require ./scripts/patch-next-env.cjs'
    )
    process.exit(2)
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: NODE_ENV=production — refusing to run a destructive spike against prod.')
    process.exit(2)
  }
  ensureOutputDir()
  const client = new BokunApiClient()
  console.log(`Sandbox: api.bokuntest.com  |  experience: ${experienceId}  |  mode: ${mode}`)

  try {
    if (mode === 'read' || mode === 'all') await modeRead(client, experienceId)
    if (mode === 'probe-externalid' || mode === 'all')
      await modeProbeExternalId(client, experienceId)
    if (mode === 'probe-required' || mode === 'all')
      await modeProbeRequired(client, experienceId)
    if (mode === 'probe-pricing' || mode === 'all')
      await modeProbePricing(client, experienceId, 57035, 30079)
    if (mode === 'probe-pricing-deep') {
      // Re-read baseline so we can echo experiencePriceRules back unchanged in V2.
      const baseline = await readExperience(client, experienceId, 'pricing-deep-baseline')
      const pricing = (baseline.PRICING ?? baseline.pricing) as Record<string, unknown>
      const inner = (pricing?.pricing ?? pricing) as Record<string, unknown>
      const existing = (inner?.experiencePriceRules ?? []) as unknown[]
      await modeProbePricingDeep(client, experienceId, 57035, 30079, 17696, existing)
    }
    if (mode === 'probe-empty' || mode === 'all') await modeProbeEmpty(client, experienceId)
    console.log(`\n✓ done.  raw output: ${OUTPUT_DIR}`)
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
