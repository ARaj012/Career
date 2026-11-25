'use client'

import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import type { NationalCutoffRow } from './ExamCutoffs'

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
const CATEGORY_ORDER = ['All', 'OPEN', 'General/UR', 'UR', 'General', 'GEN', 'EWS', 'OBC-NCL', 'OBC', 'SC', 'ST', 'PwD', 'PwBD']
const categoryRank = (c: string) => {
  const i = CATEGORY_ORDER.findIndex((x) => c.toUpperCase().startsWith(x.toUpperCase()))
  return i === -1 ? 99 : i
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
/** Stages in the order a candidate meets them: Stage I → II → III, Prelims → Mains → Final. */
function stageRank(label: string): number {
  const roman = /\bstage\s+(I{1,3}|IV|V)\b/i.exec(label)
  if (roman) return ROMAN[roman[1].toUpperCase()]
  // Last stage first: "Final (written + interview)" is a final stage, not a written one
  if (/interview|final|overall|merit/i.test(label)) return 3
  if (/mains?\b|written|tier[- ]?ii\b|phase[- ]?ii\b/i.test(label)) return 2
  if (/prelim|screening|tier[- ]?i\b|phase[- ]?i\b|part a/i.test(label)) return 1
  return 10
}

const num = (v: number) => (Number.isInteger(v) ? v.toLocaleString('en-IN') : String(v))

type Part = { label: string; rows: NationalCutoffRow[] }

/** Split rows by a key, keeping first-seen order. */
function split(rows: NationalCutoffRow[], key: (r: NationalCutoffRow) => string): Part[] {
  const map = new Map<string, NationalCutoffRow[]>()
  for (const r of rows) map.set(key(r), [...(map.get(key(r)) ?? []), r])
  return [...map.entries()].map(([label, list]) => ({ label, rows: list }))
}

/**
 * Qualifying cutoffs of the last five exam years. Exams with several
 * programmes (or papers) get one tab each; inside a tab every stage is a
 * band of one table, with a row per category and a column per year that has
 * figures. The maximum score sits in the stage heading when it is the same
 * every year.
 */
export function ExamQualifyingCutoffs({ rows, examName }: { rows: NationalCutoffRow[]; examName: string }) {
  const latest = Math.max(...rows.map((r) => r.year))
  const recent = rows.filter((r) => r.year > latest - 5)

  // Tabs: programmes if there are several, else papers if there are several
  const distinct = (f: (r: NationalCutoffRow) => string | null) => new Set(recent.map(f).filter(Boolean)).size
  const tabField: ((r: NationalCutoffRow) => string | null) | null =
    distinct((r) => r.program_or_post) > 1 ? (r) => r.program_or_post
      : distinct((r) => r.paper_or_branch) > 1 ? (r) => r.paper_or_branch
        : null
  const tabs: Part[] = tabField
    ? split(recent, (r) => tabField(r) ?? 'All programmes').sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true }))
    : [{ label: '', rows: recent }]
  const [active, setActive] = useState(0)
  if (!recent.length) return null

  const allYears = [...new Set(recent.map((r) => r.year))].sort((a, b) => a - b)
  const tab = tabs[Math.min(active, tabs.length - 1)]
  const years = [...new Set(tab.rows.map((r) => r.year))].sort((a, b) => a - b)

  // Stage bands inside the tab: whatever label parts the tab key does not already say
  const bandLabel = (r: NationalCutoffRow) =>
    [r.cutoff_type, r.stage, tabField === null || tabField(r) !== r.paper_or_branch ? r.paper_or_branch : null,
      tabField === null || tabField(r) !== r.program_or_post ? r.program_or_post : null, r.section]
      .filter(Boolean).join(' · ')
  const bands = split(tab.rows, bandLabel).sort((a, b) => stageRank(a.label) - stageRank(b.label))

  const anyUnverified = tab.rows.some((r) => r.source_type !== 'official')
  const missingYears = allYears.filter((y) => !years.includes(y))
  const sources = allYears
    .map((y) => ({ y, url: recent.find((r) => r.year === y && r.source_type === 'official' && r.source_url)?.source_url }))
    .filter((s) => s.url)
  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-sm border transition ${on ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'}`

  return (
    <div className="mb-10 scroll-mt-24" id="cutoffs">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {examName} Cutoffs, {allYears[0]}–{allYears[allYears.length - 1]}
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4">
        The minimum a candidate of each category needed. Scoring at or above the cutoff means you qualified; it does not
        guarantee a seat.
      </p>

      {tabs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Programme">
          {tabs.map((t, i) => (
            <button key={t.label} role="tab" aria-selected={i === active} onClick={() => setActive(i)} className={chip(i === active)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-2.5 font-medium">Category</th>
                {years.map((y) => <th key={y} className="px-4 py-2.5 font-medium text-right whitespace-nowrap">{y}</th>)}
              </tr>
            </thead>
            {bands.map((band) => {
              const maxes = [...new Set(band.rows.map((r) => r.max_score).filter((m): m is number => m != null))]
              const sharedMax = maxes.length === 1 ? maxes[0] : null
              const metric = band.rows.find((r) => r.cutoff_metric)?.cutoff_metric
              const categories = [...new Set(band.rows.map((r) => r.category ?? 'All candidates'))].sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'en', { numeric: true }))
              return (
                <tbody key={band.label} className="divide-y divide-gray-100 border-t border-gray-200">
                  {(band.label || sharedMax || metric) && (
                    <tr className="bg-indigo-50/60">
                      <th colSpan={years.length + 1} scope="colgroup" className="px-4 py-2 text-left">
                        <span className="font-semibold text-indigo-900">{band.label || 'Cutoff'}</span>
                        <span className="ml-2 text-xs font-normal text-indigo-700/80">
                          {sharedMax ? `marks out of ${num(sharedMax)}` : maxes.length > 1 ? 'maximum marks changed between years' : metric ? `values are ${metric}` : ''}
                        </span>
                      </th>
                    </tr>
                  )}
                  {categories.map((cat) => (
                    <tr key={cat}>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">{cat}</span>
                        {CATEGORY_HELP[cat] && <span className="block text-xs text-gray-500">{CATEGORY_HELP[cat]}</span>}
                      </td>
                      {years.map((y) => {
                        const r = band.rows.find((x) => x.year === y && (x.category ?? 'All candidates') === cat)
                        const official = r?.source_type === 'official'
                        let text = '—'
                        if (r?.cutoff_score != null) {
                          text = num(r.cutoff_score)
                          if (r.cutoff_score_to != null) text += ` – ${num(r.cutoff_score_to)}`
                          if (!sharedMax && r.max_score) text += ` / ${num(r.max_score)}`
                        }
                        return (
                          <td key={y} className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${r ? (official ? 'font-semibold text-gray-900' : 'text-gray-500') : 'text-gray-300'}`}>
                            {text}
                            {r && !official && <span className="text-amber-700" title="Not yet confirmed from an official notice">*</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 space-y-1">
        {tabs.length > 1 && missingYears.length > 0 && (
          <p>No published figures for {tab.label} in {missingYears.join(', ')}.</p>
        )}
        {sources.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" /> Official notices:
            {sources.map((s) => (
              <a key={s.y} href={s.url!} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">{s.y}</a>
            ))}
          </p>
        )}
        {anyUnverified && <p><span className="text-amber-700">*</span> Not yet confirmed from the conducting body&apos;s own notice; it is replaced as soon as the official figure is read.</p>}
      </div>
    </div>
  )
}
