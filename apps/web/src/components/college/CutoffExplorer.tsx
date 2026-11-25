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

const CATEGORY_HELP: Record<string, string> = {
  OPEN: 'General', EWS: 'Economically Weaker Section', 'OBC-NCL': 'OBC (non-creamy layer)', SC: 'Scheduled Caste', ST: 'Scheduled Tribe',
}

/** OPEN, EWS, OBC-NCL, SC, ST, each followed by its PwD seats */
const categoryOrder = (c: string) => {
  const i = Object.keys(CATEGORY_HELP).indexOf(c.replace(/\s*\(PwD\)$/, ''))
  return (i === -1 ? 99 : i) + (/PwD/.test(c) ? 0.5 : 0)
}

/**
 * Official closing ranks of the last five years: a row per programme, a
 * column per year, for the chosen quota and category, explained in plain words.
 */
export default function CutoffExplorer({ rows }: { rows: OfficialCutoff[] }) {
  const allYears = useMemo(() => uniq(rows.map((r) => r.year)).sort((a, b) => a - b), [rows])
  const years = allYears.slice(-5)
  const recent = rows.filter((r) => years.includes(r.year))
  const quotas = uniq(recent.map((r) => r.quota ?? '')).filter(Boolean)
  const [quota, setQuota] = useState(quotas.includes('AI') ? 'AI' : quotas.includes('OS') ? 'OS' : quotas[0])
  const categories = uniq(recent.map((r) => (r.category ?? '').replace(' · Female-only', ''))).filter(Boolean)
    .sort((a, b) => categoryOrder(a) - categoryOrder(b))
  const [category, setCategory] = useState(categories.includes('OPEN') ? 'OPEN' : categories[0])
  const [female, setFemale] = useState(false)
  const [program, setProgram] = useState<string | null>(null)

  if (!rows.length) return null
  const cat = female ? `${category} · Female-only` : category
  const latest = years[years.length - 1]
  const chosenRows = recent.filter((r) => (r.quota ?? '') === quota && r.category === cat)
  const programs = uniq(chosenRows.map((r) => r.program_name ?? ''))
    .filter(Boolean)
    .map((name) => ({ name, byYear: new Map(chosenRows.filter((r) => r.program_name === name).map((r) => [r.year, r])) }))
    .sort((a, b) => (a.byYear.get(latest)?.cutoff_rank ?? Infinity) - (b.byYear.get(latest)?.cutoff_rank ?? Infinity))
  const chosen = program ?? programs[0]?.name ?? null
  const trend = chosenRows
    .filter((r) => r.program_name === chosen && r.cutoff_rank)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ label: String(r.year), value: r.cutoff_rank as number }))
  const meta = recent[0]
  const select = 'px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div id="cutoffs" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-32">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" /> Admission Cutoffs ({meta?.exam_name ?? 'JEE'}), {years[0]}–{latest}
        </h2>
        <a href={meta?.source_url ?? '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
          <BadgeCheck className="w-3.5 h-3.5" /> Official · JoSAA {meta?.round ?? ''}
        </a>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Each number is the <span className="font-medium">closing rank</span>: the last {meta?.exam_name ?? 'JEE'} rank that got this seat in the final
        JoSAA round. If your rank was at or below it, you would have got the seat. Smaller number = harder to get.
        {category !== 'OPEN' && ' For reserved categories, compare your category rank.'}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <select aria-label="Quota" className={select} value={quota} onChange={(e) => setQuota(e.target.value)}>
          {quotas.map((q) => <option key={q} value={q}>{QUOTA[q] ?? q} quota</option>)}
        </select>
        <select aria-label="Category" className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}{CATEGORY_HELP[c] && c !== 'OPEN' ? ` (${CATEGORY_HELP[c]})` : ''}</option>)}
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} /> Female-only seats
        </label>
      </div>
      {quota === 'HS' && <p className="text-xs text-gray-500 -mt-2 mb-3">Home State quota: only for students from the college&apos;s own state.</p>}
      {quota === 'OS' && <p className="text-xs text-gray-500 -mt-2 mb-3">Other State quota: for students from outside the college&apos;s state.</p>}

      {programs.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">No seats in this combination.</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Programme</th>
                {years.map((y) => <th key={y} className="px-3 py-2 font-medium text-right">{y}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programs.map((p) => (
                <tr
                  key={p.name}
                  onClick={() => setProgram(p.name)}
                  className={`cursor-pointer hover:bg-orange-50 ${p.name === chosen ? 'bg-orange-50' : ''}`}
                >
                  <td className="px-3 py-2 text-gray-800">{p.name}</td>
                  {years.map((y) => {
                    const r = p.byYear.get(y)
                    return (
                      <td key={y} className="px-3 py-2 text-right tabular-nums text-gray-900" title={r?.opening_rank ? `Opening rank ${rank(r.opening_rank)}` : undefined}>
                        {rank(r?.cutoff_rank ?? null)}
                      </td>
                    )
                  })}
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
          <p className="text-xs text-gray-500 mt-2">Click a programme above to change. Hover a rank to see the opening rank (the best rank admitted).</p>
        </div>
      )}
    </div>
  )
}
