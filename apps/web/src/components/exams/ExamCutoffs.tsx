import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'

export interface NationalCutoffRow {
  year: number
  category: string | null
  stage: string | null
  cutoff_type: string | null
  cutoff_metric: string | null
  cutoff_score: number | null
  cutoff_score_to: number | null
  max_score: number | null
  paper_or_branch: string | null
  program_or_post: string | null
  section: string | null
  source_type: string | null
  source_url: string | null
}

const CATEGORY_HELP: Record<string, string> = {
  OPEN: 'General (no reservation)',
  'General/UR': 'General / Unreserved',
  UR: 'Unreserved (General)',
  EWS: 'Economically Weaker Section',
  'OBC-NCL': 'Other Backward Classes (non-creamy layer)',
  SC: 'Scheduled Caste',
  ST: 'Scheduled Tribe',
  PwD: 'Persons with Disability',
}
const CATEGORY_ORDER = ['OPEN', 'General/UR', 'UR', 'General', 'EWS', 'OBC-NCL', 'OBC', 'SC', 'ST', 'PwD']
const categoryRank = (c: string) => {
  const i = CATEGORY_ORDER.findIndex((x) => c.toUpperCase().startsWith(x.toUpperCase()))
  return i === -1 ? 99 : i
}

function formatValue(r: NationalCutoffRow): string {
  if (r.cutoff_score == null) return '—'
  const n = (v: number) => (Number.isInteger(v) ? v.toLocaleString('en-IN') : String(v))
  let s = n(r.cutoff_score)
  if (r.cutoff_score_to != null) s += ` – ${n(r.cutoff_score_to)}`
  if (r.max_score) s += ` / ${n(r.max_score)}`
  return s
}

/** "Qualifying for JEE (Advanced)" · Prelims · Paper I, whichever the rows carry. */
const groupLabel = (r: NationalCutoffRow) =>
  [r.cutoff_type, r.stage, r.paper_or_branch, r.program_or_post, r.section].filter(Boolean).join(' · ') || 'Cutoff'

/**
 * Qualifying cutoffs of the last five exam years: one table per kind of
 * cutoff, a row per category, a column per year, in plain words.
 */
export function ExamQualifyingCutoffs({ rows, examName }: { rows: NationalCutoffRow[]; examName: string }) {
  const latest = Math.max(...rows.map((r) => r.year))
  const recent = rows.filter((r) => r.year > latest - 5)
  if (!recent.length) return null
  const years = [...new Set(recent.map((r) => r.year))].sort((a, b) => a - b)

  const groups = new Map<string, NationalCutoffRow[]>()
  for (const r of recent) groups.set(groupLabel(r), [...(groups.get(groupLabel(r)) ?? []), r])
  const anyUnverified = recent.some((r) => r.source_type !== 'official')
  const sources = years
    .map((y) => ({ y, url: recent.find((r) => r.year === y && r.source_type === 'official' && r.source_url)?.source_url }))
    .filter((s) => s.url)

  return (
    <div className="mb-10" id="cutoffs">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {examName} Cutoffs, {years[0]}–{years[years.length - 1]}
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4">
        The minimum a candidate of each category needed. Scoring at or above the cutoff means you qualified; it does not
        guarantee a seat.
      </p>

      <div className="space-y-6">
        {[...groups.entries()].map(([label, list]) => {
          const metric = list.find((r) => r.cutoff_metric)?.cutoff_metric
          const categories = [...new Set(list.map((r) => r.category ?? 'All categories'))].sort((a, b) => categoryRank(a) - categoryRank(b))
          return (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              {metric && <p className="text-sm text-gray-500 mb-3">Values are {metric}{/percentile/i.test(metric) ? ' (out of 100)' : ''}</p>}
              <div className="overflow-x-auto rounded-lg border border-gray-100 mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-3 py-2 font-medium">Category</th>
                      {years.map((y) => <th key={y} className="px-3 py-2 font-medium text-right whitespace-nowrap">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                      <tr key={cat}>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-gray-900">{cat}</span>
                          {CATEGORY_HELP[cat] && <span className="block text-xs text-gray-400">{CATEGORY_HELP[cat]}</span>}
                        </td>
                        {years.map((y) => {
                          const r = list.find((x) => x.year === y && (x.category ?? 'All categories') === cat)
                          const official = r?.source_type === 'official'
                          return (
                            <td key={y} className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap ${official ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                              {r ? formatValue(r) : '—'}
                              {r && !official && <span className="text-amber-600" title="Not yet confirmed from an official notice">*</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500 space-y-1">
        {sources.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Official notices:
            {sources.map((s) => (
              <a key={s.y} href={s.url!} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">{s.y}</a>
            ))}
          </p>
        )}
        {anyUnverified && <p><span className="text-amber-600">*</span> Not yet confirmed from the conducting body&apos;s own notice; it is replaced as soon as the official figure is read.</p>}
      </div>
    </div>
  )
}

export interface CollegeCutoffRow {
  year: number
  quota: string | null
  opening_rank: number | null
  cutoff_rank: number | null
  colleges: { name: string; slug: string | null; nirf_rank: number | null } | null
}

export const BRANCHES: Record<string, { label: string; program: string }> = {
  cse: { label: 'Computer Science', program: 'Computer Science and Engineering (4 Years, Bachelor of Technology)' },
  ece: { label: 'Electronics & Communication', program: 'Electronics and Communication Engineering (4 Years, Bachelor of Technology)' },
  ee: { label: 'Electrical', program: 'Electrical Engineering (4 Years, Bachelor of Technology)' },
  me: { label: 'Mechanical', program: 'Mechanical Engineering (4 Years, Bachelor of Technology)' },
  ce: { label: 'Civil', program: 'Civil Engineering (4 Years, Bachelor of Technology)' },
}
export const RANK_CATEGORIES = ['OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST']
const QUOTA: Record<string, string> = { AI: 'All India', OS: 'Other State' }

/**
 * Final-round closing ranks (official JoSAA) for one branch and category:
 * a row per college, a column per year. Branch and category switch by link,
 * so the page only loads the rows it shows.
 */
export function ExamCollegeCutoffs({
  rows, slug, branch, category, examName,
}: { rows: CollegeCutoffRow[]; slug: string; branch: string; category: string; examName: string }) {
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b)
  const latest = years[years.length - 1]
  const byCollege = new Map<string, { college: CollegeCutoffRow['colleges']; quota: string | null; byYear: Map<number, number | null> }>()
  for (const r of rows) {
    if (!r.colleges) continue
    const entry = byCollege.get(r.colleges.name) ?? { college: r.colleges, quota: r.quota, byYear: new Map() }
    entry.byYear.set(r.year, r.cutoff_rank)
    byCollege.set(r.colleges.name, entry)
  }
  const list = [...byCollege.values()].sort((a, b) => (a.byYear.get(latest) ?? Infinity) - (b.byYear.get(latest) ?? Infinity))
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm border transition ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'}`
  const href = (b: string, c: string) => `/exams/${slug}?branch=${b}&cat=${encodeURIComponent(c)}#college-cutoffs`

  return (
    <div className="mb-10 scroll-mt-24" id="college-cutoffs">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Closing Ranks by College{years.length ? `, ${years[0]}–${latest}` : ''}</h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4">
        The last {examName} rank that got a seat in the final JoSAA round. If your rank was at or below this number, you
        would have got that seat. A smaller number means the seat is harder to get.
      </p>

      <div className="flex flex-wrap gap-2 mb-2">
        {Object.entries(BRANCHES).map(([key, b]) => (
          <Link key={key} href={href(key, category)} scroll={false} className={chip(key === branch)}>{b.label}</Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {RANK_CATEGORIES.map((c) => (
          <Link key={c} href={href(branch, c)} scroll={false} className={chip(c === category)} title={CATEGORY_HELP[c]}>{c}</Link>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-2xl p-6 text-center">No {BRANCHES[branch].label} seats for {category} in this exam&apos;s colleges.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">College</th>
                  {years.map((y) => <th key={y} className="px-3 py-2 font-medium text-right">{y}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((e) => (
                  <tr key={e.college!.name}>
                    <td className="px-3 py-2">
                      {e.college!.slug ? (
                        <Link href={`/colleges/${e.college!.slug}#cutoffs`} className="text-indigo-600 hover:underline">{e.college!.name}</Link>
                      ) : e.college!.name}
                      {e.quota && <span className="block text-xs text-gray-400">{QUOTA[e.quota] ?? e.quota} quota</span>}
                    </td>
                    {years.map((y) => {
                      const v = e.byYear.get(y)
                      return <td key={y} className="px-3 py-2 text-right tabular-nums text-gray-900">{v != null ? v.toLocaleString('en-IN') : '—'}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          Official JoSAA opening and closing ranks, gender-neutral seats. For OPEN, compare your common rank (CRL); for other
          categories, your category rank. NITs and IIITs show the Other State quota (students from outside the college&apos;s
          state); home-state students usually get in at higher ranks — see each college&apos;s page for every quota.
        </span>
      </p>
    </div>
  )
}
