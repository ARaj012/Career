'use client'

import { useMemo, useState } from 'react'
import { Trophy, BadgeCheck } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'

export interface OfficialCutoff {
  year: number
  exam_name: string | null
  program_name: string | null
  quota: string | null
  category: string | null
  opening_rank: number | null
  cutoff_rank: number | null
  round: string | null
  source_url: string | null
}

const QUOTA: Record<string, string> = { AI: 'All India', OS: 'Other State', HS: 'Home State', GO: 'Goa', JK: 'J&K', LA: 'Ladakh' }
const rank = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-IN'))
const uniq = <T,>(xs: T[]) => [...new Set(xs)]

/** Official opening/closing ranks with filters, plus a closing-rank trend for one programme. */
export default function CutoffExplorer({ rows }: { rows: OfficialCutoff[] }) {
  const years = useMemo(() => uniq(rows.map((r) => r.year)).sort((a, b) => b - a), [rows])
  const [year, setYear] = useState(years[0])
  const inYear = rows.filter((r) => r.year === year)
  const quotas = uniq(inYear.map((r) => r.quota ?? '')).filter(Boolean)
  const [quota, setQuota] = useState(quotas.includes('AI') ? 'AI' : quotas.includes('OS') ? 'OS' : quotas[0])
  const categories = uniq(inYear.map((r) => (r.category ?? '').replace(' · Female-only', ''))).filter(Boolean).sort()
  const [category, setCategory] = useState(categories.includes('OPEN') ? 'OPEN' : categories[0])
  const [female, setFemale] = useState(false)
  const [program, setProgram] = useState<string | null>(null)

  if (!rows.length) return null
  const cat = female ? `${category} · Female-only` : category
  const list = inYear
    .filter((r) => (r.quota ?? '') === quota && r.category === cat)
    .sort((a, b) => (a.cutoff_rank ?? Infinity) - (b.cutoff_rank ?? Infinity))
  const chosen = program ?? list[0]?.program_name ?? null
  const trend = rows
    .filter((r) => r.program_name === chosen && (r.quota ?? '') === quota && r.category === cat && r.cutoff_rank)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ label: String(r.year), value: r.cutoff_rank as number }))
  const meta = inYear[0]
  const select = 'px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div id="cutoffs" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" /> Admission Cutoffs ({meta?.exam_name ?? 'JEE'})
        </h2>
        <a href={meta?.source_url ?? '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
          <BadgeCheck className="w-3.5 h-3.5" /> Official · JoSAA {meta?.round ?? ''}
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select aria-label="Year" className={select} value={year} onChange={(e) => { setYear(Number(e.target.value)); setProgram(null) }}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select aria-label="Quota" className={select} value={quota} onChange={(e) => setQuota(e.target.value)}>
          {quotas.map((q) => <option key={q} value={q}>{QUOTA[q] ?? q}</option>)}
        </select>
        <select aria-label="Category" className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} /> Female-only seats
        </label>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">No seats in this combination for {year}.</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Programme</th>
                <th className="px-3 py-2 font-medium text-right">Opening rank</th>
                <th className="px-3 py-2 font-medium text-right">Closing rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((r) => (
                <tr
                  key={`${r.program_name}`}
                  onClick={() => setProgram(r.program_name)}
                  className={`cursor-pointer hover:bg-orange-50 ${r.program_name === chosen ? 'bg-orange-50' : ''}`}
                >
                  <td className="px-3 py-2 text-gray-800">{r.program_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">{rank(r.opening_rank)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">{rank(r.cutoff_rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chosen && trend.length >= 2 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Closing rank by year · {chosen}</h3>
          <SimpleBarChart data={trend} barColorClass="bg-orange-500" valueFormatter={(v) => `Rank ${Math.round(v).toLocaleString('en-IN')}`} />
          <p className="text-xs text-gray-400 mt-2">Final-round closing rank; a lower number means a more competitive cutoff. Click a programme above to change.</p>
        </div>
      )}
    </div>
  )
}
