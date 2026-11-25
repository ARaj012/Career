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
/** Qualifying cutoffs: one tab per programme, stages as bands of one table. */
export { ExamQualifyingCutoffs } from './QualifyingCutoffs'

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
                      {e.quota && <span className="block text-xs text-gray-500">{QUOTA[e.quota] ?? e.quota} quota</span>}
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
        <BadgeCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          Official JoSAA opening and closing ranks, gender-neutral seats. For OPEN, compare your common rank (CRL); for other
          categories, your category rank. NITs and IIITs show the Other State quota (students from outside the college&apos;s
          state); home-state students usually get in at higher ranks — see each college&apos;s page for every quota.
        </span>
      </p>
    </div>
  )
}
