/**
 * READ-ONLY direct Bokun-host availability probe.
 *
 * Answers, authoritatively (straight at the Bokun host, not via our app route):
 * which availability endpoint does a given Bokun account actually serve for an experience?
 *
 * GET-only — makes NO writes, so it is safe to point at prod. (Unlike the write spike,
 * there is no prod-refuse guard because it cannot mutate anything.)
 *
 * Usage (sandbox, default — reuses apps/web/.env.local creds):
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/bokun-availability-host-probe.ts \
 *     --host=test --experience-id=24010
 *
 * Usage (PROD — supply prod creds via env so they never touch source/chat):
 *   BOKUN_PROBE_KEY=<prodAccessKey> BOKUN_PROBE_SECRET=<prodSecret> \
 *   npx tsx scripts/bokun-availability-host-probe.ts --host=prod --experience-id=<prodExperienceId>
 *
 * Reads creds from BOKUN_PROBE_KEY/BOKUN_PROBE_SECRET first, else BOKUN_API_KEY/BOKUN_SECRET_KEY.
 */
import { createHmac } from 'crypto'

const args = process.argv.slice(2)
const get = (f: string) => args.find((a) => a.startsWith(`${f}=`))?.split('=').slice(1).join('=')
const host = (get('--host') ?? 'test') === 'prod' ? 'https://api.bokun.io' : 'https://api.bokuntest.com'
// experience id: --experience-id flag wins, else EXPERIENCE_ID env (loaded from .env.local), else sandbox default
const experienceId = get('--experience-id') ?? process.env.EXPERIENCE_ID ?? '24010'
const days = Number(get('--days') ?? '90')

const accessKey = process.env.BOKUN_PROBE_KEY || process.env.BOKUN_API_KEY
const secretKey = process.env.BOKUN_PROBE_SECRET || process.env.BOKUN_SECRET_KEY
if (!accessKey || !secretKey) {
  console.error('ERROR: set BOKUN_PROBE_KEY/BOKUN_PROBE_SECRET (or BOKUN_API_KEY/BOKUN_SECRET_KEY).')
  process.exit(2)
}

function bokunDate(d: Date) {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}
async function get_(p: string): Promise<{ url: string; status: number; server: string; body: string }> {
  const date = bokunDate(new Date())
  const sig = createHmac('sha1', secretKey!).update(`${date}${accessKey}GET${p}`).digest('base64')
  const url = `${host}${p}`
  const r = await fetch(url, {
    headers: {
      'X-Bokun-AccessKey': accessKey!,
      'X-Bokun-Date': date,
      'X-Bokun-Signature': sig,
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
    },
  })
  // r.url is the ACTUAL fetched URL (post-redirect); proves which host answered.
  return {
    url: r.url,
    status: r.status,
    server: r.headers.get('server') ?? r.headers.get('x-served-by') ?? '(no server header)',
    body: (await r.text()).slice(0, 300),
  }
}

async function main() {
  const start = new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  const id = encodeURIComponent(experienceId)

  const probes = [
    `/restapi/v2.0/activity/${id}/availabilities?start=${start}&end=${end}&currency=SEK`, // prod code path
    `/restapi/v2.0/experience/${id}/availabilities?start=${start}&end=${end}&currency=SEK`,
    `/activity.json/${id}/availabilities?start=${start}&end=${end}`, // old Booking API
    `/restapi/v2.0/experience/${id}/components?componentType=RATES`, // sanity: does the id resolve at all?
  ]

  console.log(`configured host=${host} experienceId=${experienceId} window=${start}..${end}\n`)
  for (const p of probes) {
    const r = await get_(p)
    const verdict = r.status === 200 ? '✅ 200' : `·  ${r.status}`
    console.log(`${verdict}  actualUrl=${r.url}`)
    console.log(`       server=${r.server}`)
    if (r.status !== 200) console.log(`       body=${r.body}`)
  }
  console.log('\nVerdict: `actualUrl` is the host that answered (post any redirect). It must be api.bokuntest.com / api.bokun.io — NOT our app.')
}

main()
