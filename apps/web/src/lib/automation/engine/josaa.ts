/**
 * Official JEE cutoffs (opening and closing ranks) from JoSAA, the joint seat
 * allocation for IITs, NITs, IIITs and other government-funded technical
 * institutes. Final-round ranks for the last six admission years.
 *
 * Deterministic (no AI). JoSAA's archive is an ASP.NET form, so each request
 * replays the form's own post-backs; one "ALL" request returns every institute.
 * Rows are written in bulk per college and year, replacing earlier official rows.
 */
import * as cheerio from 'cheerio'
import type { SupabaseClient } from '@supabase/supabase-js'
import { USER_AGENT } from './http'
import { canonName } from './nirf'

const ARCHIVE = 'https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx'
const CURRENT = 'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx'

export type OrcrRow = {
  institute: string
  program: string
  quota: string
  seatType: string
  gender: string
  opening: number
  closing: number
}

type Form = { hidden: Record<string, string>; selects: Record<string, { value: string; text: string }[]>; html: string }

/** Minimal client for one ASP.NET page: keeps the session cookie and replays post-backs. */
class AspForm {
  private cookie = ''
  private form: Form | null = null
  private values: Record<string, string> = {}
  constructor(private url: string) {}

  private parse(html: string): Form {
    const $ = cheerio.load(html)
    const hidden: Record<string, string> = {}
    $('input[type=hidden]').each((_, e) => { hidden[$(e).attr('name')!] = $(e).attr('value') ?? '' })
    const selects: Form['selects'] = {}
    $('select').each((_, s) => {
      selects[$(s).attr('name')!] = $(s).find('option').map((__, o) => ({ value: $(o).attr('value') ?? '', text: $(o).text().trim() })).get()
    })
    return { hidden, selects, html }
  }

  private async send(body?: URLSearchParams) {
    await new Promise((r) => setTimeout(r, 2500)) // polite pace
    const res = await fetch(this.url, {
      method: body ? 'POST' : 'GET',
      headers: { 'User-Agent': USER_AGENT, Cookie: this.cookie, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      body,
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) throw new Error(`JoSAA HTTP ${res.status}`)
    const set = res.headers.getSetCookie?.() ?? []
    if (set.length) this.cookie = set.map((c) => c.split(';')[0]).join('; ')
    this.form = this.parse(await res.text())
  }

  async open() { await this.send() }

  /** Field name ending in e.g. "ddlYear" (case-insensitive; the two pages differ in case). */
  field(suffix: string): string | null {
    return Object.keys(this.form?.selects ?? {}).find((k) => k.toLowerCase().endsWith(suffix.toLowerCase())) ?? null
  }
  options(suffix: string) { const f = this.field(suffix); return f ? this.form!.selects[f] : [] }

  async choose(suffix: string, value: string) {
    const name = this.field(suffix)
    if (!name) throw new Error(`JoSAA form has no ${suffix}`)
    this.values[name] = value
    await this.send(new URLSearchParams({ ...this.form!.hidden, __EVENTTARGET: name, __EVENTARGUMENT: '', ...this.values }))
  }

  async submit(): Promise<string> {
    const button = cheerio.load(this.form!.html)('input[type=submit]').attr('name') ?? 'ctl00$ContentPlaceHolder1$btnSubmit'
    const name = this.field('ddlSeatType')!
    this.values[name] = this.options('ddlSeatType').find((o) => /^all$/i.test(o.text))?.value ?? 'ALL'
    await this.send(new URLSearchParams({ ...this.form!.hidden, __EVENTTARGET: '', __EVENTARGUMENT: '', ...this.values, [button]: 'Submit' }))
    return this.form!.html
  }
}

export function parseOrcrTable(html: string): OrcrRow[] {
  const $ = cheerio.load(html)
  const table = $('table').filter((_, t) => /Opening Rank/i.test($(t).find('tr').first().text())).first()
  const out: OrcrRow[] = []
  table.find('tr').slice(1).each((_, tr) => {
    const c = $(tr).find('td').map((__, td) => $(td).text().replace(/\s+/g, ' ').trim()).get()
    if (c.length < 7) return
    // "1234P" = preparatory-course rank (PwD); not comparable with regular ranks, so skipped
    if (!/^\d+$/.test(c[5]) || !/^\d+$/.test(c[6])) return
    out.push({ institute: c[0], program: c[1], quota: c[2], seatType: c[3], gender: c[4], opening: Number(c[5]), closing: Number(c[6]) })
  })
  return out
}

/** Final-round ranks for one year (archive), or for the running year (current page). */
async function fetchFinalRound(year: number | 'current'): Promise<{ rows: OrcrRow[]; round: string }> {
  const f = new AspForm(year === 'current' ? CURRENT : ARCHIVE)
  await f.open()
  if (year !== 'current') await f.choose('ddlYear', String(year))
  const rounds = f.options('ddlroundno').map((o) => o.value).filter((v) => /^\d+$/.test(v) && v !== '0')
  if (!rounds.length) return { rows: [], round: '' }
  const last = String(Math.max(...rounds.map(Number)))
  await f.choose('ddlroundno', last)
  await f.choose('ddlInstype', 'ALL')
  await f.choose('ddlInstitute', 'ALL')
  await f.choose('ddlBranch', 'ALL')
  return { rows: parseOrcrTable(await f.submit()), round: `Round ${last} (final)` }
}

// ---------------------------------------------------------------- institute ↔ college

type Kind = 'IIT' | 'NIT' | 'IIITDM' | 'IIIT' | 'SPA' | 'IIEST' | 'OTHER'
function kindOf(canon: string): Kind {
  if (/electronics and information technology/.test(canon)) return 'OTHER' // NIELIT centres, not IIITs
  if (/design and manufactur/.test(canon)) return 'IIITDM' // JoSAA spells Jabalpur "Manufacture"
  if (/information technology/.test(canon)) return 'IIIT'
  if (/national institute of technology/.test(canon)) return 'NIT'
  if (/indian institute of technology/.test(canon)) return 'IIT'
  if (/planning and architecture/.test(canon)) return 'SPA'
  if (/engineering science and technology/.test(canon)) return 'IIEST'
  return 'OTHER'
}
const GENERIC = new Set(['indian', 'institute', 'of', 'and', 'the', 'technology', 'information', 'national', 'design', 'manufacturing', 'management', 'school', 'planning', 'architecture', 'engineering', 'science', 'university', 'iiit', 'iit', 'nit', 'iiitdm', 'ism', 'rajasthan', 'karnataka'])
const distinct = (canon: string) => canon.split(' ').filter((w) => w.length >= 3 && !GENERIC.has(w))

/** JoSAA institute for a college: same kind of institute and its distinguishing word (or city) in the name; unique or nothing. */
export function matchInstitute(col: { name: string; city: string | null }, institutes: string[]): string | null {
  const canon = canonName(col.name)
  const kind = kindOf(canon)
  const words = distinct(canon)
  // Other government-funded institutes need two distinguishing words ("birla" + "mesra"), never one
  if (kind === 'OTHER' && words.length < 2) return null
  // A separate campus ("…: Indian Oil Odisha Campus", "Off-Campus", "International Campus Diu") is a different institute
  const campusOk = (i: string) => /campus/i.test(col.name) || !/campus/i.test(i)
  const pool = institutes.filter((i) => kindOf(canonName(i)) === kind && campusOk(i))
  const has = (i: string, w: string) => ` ${canonName(i)} `.includes(` ${w} `)
  // Several candidates: keep the one with the fewest extra qualifiers
  const best = (hits: string[]) => {
    if (hits.length <= 1) return hits
    const extra = (i: string) => distinct(canonName(i)).filter((w) => !words.includes(w)).length
    const min = Math.min(...hits.map(extra))
    return hits.filter((i) => extra(i) === min)
  }
  let hits = words.length ? best(pool.filter((i) => words.every((w) => has(i, w)))) : []
  if (hits.length !== 1 && col.city && kind !== 'OTHER') {
    const city = distinct(canonName(col.city))
    if (city.length) hits = best(pool.filter((i) => city.every((w) => has(i, w))))
  }
  return hits.length === 1 ? hits[0] : null
}

// ---------------------------------------------------------------- update

export async function updateJosaaCutoffs(
  db: SupabaseClient,
  // step: process only that entry of the year plan (0 = the running year), so a sweep can do one year per request
  opts: { dryRun: boolean; years?: number; step?: number; log?: (s: string) => void }
): Promise<{ years: number[]; colleges: number; rows: number; matches: Record<string, string>; unmatched: string[]; errors: string[]; planLength: number }> {
  const say = opts.log ?? console.log
  const errors: string[] = []
  const { data: exams } = await db.from('exams').select('id, slug').in('slug', ['jee-main', 'jee-advanced'])
  const examId = (inst: string) => exams?.find((e) => e.slug === (kindOf(canonName(inst)) === 'IIT' ? 'jee-advanced' : 'jee-main'))?.id
  const { data: colleges } = await db.from('colleges').select('id, name, city')

  // Which archive years exist; the current page is the year after the newest archived one
  const probe = new AspForm(ARCHIVE)
  await probe.open()
  const archived = probe.options('ddlYear').map((o) => Number(o.value)).filter((y) => y > 2000).sort((a, b) => b - a)
  const want = opts.years ?? 6
  const plan: (number | 'current')[] = ['current', ...archived.slice(0, want - 1)]

  const years: number[] = []
  let total = 0
  const matched = new Set<string>()
  const matches: Record<string, string> = {}
  const unmatched = new Set<string>()
  const todo = opts.step === undefined ? plan : plan.slice(opts.step, opts.step + 1)
  for (const y of todo) {
    const year = y === 'current' ? archived[0] + 1 : y
    let data: { rows: OrcrRow[]; round: string }
    try {
      data = await fetchFinalRound(y)
    } catch (err) {
      errors.push(`JoSAA ${year}: ${(err as Error).message}`)
      continue
    }
    if (!data.rows.length) { say(`  JoSAA ${year}: no final-round data published`); continue }
    years.push(year)
    say(`  JoSAA ${year} ${data.round}: ${data.rows.length} rows`)

    const institutes = [...new Set(data.rows.map((r) => r.institute))]
    const byCollege = new Map<string, { inst: string; rows: OrcrRow[] }>()
    for (const col of colleges ?? []) {
      const inst = matchInstitute(col, institutes)
      if (!inst) continue
      byCollege.set(col.id, { inst, rows: data.rows.filter((r) => r.institute === inst) })
      matched.add(col.name)
      matches[col.name] = inst
    }
    for (const i of institutes) if (![...byCollege.values()].some((v) => v.inst === i)) unmatched.add(i)

    for (const [collegeId, { inst, rows }] of byCollege) {
      const exam = examId(inst)
      if (!exam) continue
      const records = rows.map((r) => ({
        college_id: collegeId,
        exam_id: exam,
        year,
        program_name: r.program,
        quota: r.quota,
        category: /female/i.test(r.gender) ? `${r.seatType} · Female-only` : r.seatType,
        opening_rank: r.opening,
        cutoff_rank: r.closing,
        round: data.round,
        source_type: 'official',
        source_url: y === 'current' ? CURRENT : `${ARCHIVE}#year=${year}`,
      }))
      total += records.length
      if (opts.dryRun) continue
      // Replace this college's official rows for the year in one go
      const del = await db.from('college_exam_cutoffs').delete().eq('college_id', collegeId).eq('exam_id', exam).eq('year', year).eq('source_type', 'official')
      if (del.error) { errors.push(`${inst} ${year}: ${del.error.message}`); continue }
      for (let i = 0; i < records.length; i += 500) {
        const ins = await db.from('college_exam_cutoffs').insert(records.slice(i, i + 500))
        if (ins.error) { errors.push(`${inst} ${year}: ${ins.error.message}`); break }
      }
    }
  }
  return { years, colleges: matched.size, rows: total, matches, unmatched: [...unmatched].sort(), errors, planLength: plan.length }
}
