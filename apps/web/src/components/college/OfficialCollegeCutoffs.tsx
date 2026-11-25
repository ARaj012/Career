import { BadgeCheck } from 'lucide-react'

export interface OfficialNoticeCutoff {
  year: number
  exam_name: string | null
  program_name: string | null
  quota: string | null
  category: string | null
  opening_rank: number | null
  cutoff_rank: number | null
  cutoff_score: number | null
  round: string | null
  source_url: string | null
}

const num = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-IN') : String(n))

/**
 * Official cutoffs read from the college's or the counselling body's own notice
 * (every exam except JEE, whose JoSAA ranks have their own explorer): one table
 * per exam, a row per programme · category · quota, a column per year.
 */
export default function OfficialCollegeCutoffs({ rows }: { rows: OfficialNoticeCutoff[] }) {
  if (!rows.length) return null
  const exams = [...new Set(rows.map((r) => r.exam_name ?? 'Entrance exam'))]
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm scroll-mt-32" id="official-cutoffs">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Admission Cutoffs</h2>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
          <BadgeCheck className="w-3.5 h-3.5" /> Official notices
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        The last rank or score admitted in each category, as the college or the counselling body published it. Scoring
        better than this in that year would have got a seat.
      </p>
      <div className="space-y-6">
        {exams.map((exam) => {
          const list = rows.filter((r) => (r.exam_name ?? 'Entrance exam') === exam)
          const years = [...new Set(list.map((r) => r.year))].sort((a, b) => a - b).slice(-5)
          const key = (r: OfficialNoticeCutoff) => `${r.program_name ?? ''}|${r.category ?? ''}|${r.quota ?? ''}`
          const lines = [...new Map(list.map((r) => [key(r), r])).values()]
            .sort((a, b) => (a.program_name ?? '').localeCompare(b.program_name ?? '') || (a.category ?? '').localeCompare(b.category ?? ''))
          const sources = [...new Map(list.filter((r) => r.source_url).map((r) => [r.year, r.source_url!])).entries()].sort((a, b) => a[0] - b[0])
          return (
            <div key={exam}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{exam}</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-3 py-2 font-medium">Programme</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      {years.map((y) => <th key={y} className="px-3 py-2 font-medium text-right">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((l) => (
                      <tr key={key(l)}>
                        <td className="px-3 py-2 text-gray-900">{l.program_name ?? 'All programmes'}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {l.category ?? '—'}
                          {l.quota && <span className="block text-xs text-gray-400">{l.quota}</span>}
                        </td>
                        {years.map((y) => {
                          const r = list.find((x) => x.year === y && key(x) === key(l))
                          const v = r?.cutoff_rank ?? r?.cutoff_score
                          return (
                            <td key={y} className="px-3 py-2 text-right tabular-nums text-gray-900" title={r?.opening_rank ? `Opening rank ${num(r.opening_rank)}` : r?.round ?? undefined}>
                              {v != null ? (r?.cutoff_rank != null ? `#${num(v)}` : num(v)) : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sources.length > 0 && (
                <p className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-2">
                  Sources:
                  {sources.map(([y, url]) => (
                    <a key={y} href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">{y}</a>
                  ))}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
