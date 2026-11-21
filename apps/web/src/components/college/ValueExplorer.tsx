'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, BadgeCheck, Info, Search } from 'lucide-react'
import { PROGRAMMES, payback, rupees, type Programme, type ValueRow } from '@/lib/college-value'

// Categorical slots 1–3 of the validated chart palette (all-pairs safe for scatter)
const TYPE_COLOR: Record<ValueRow['type'], string> = {
  Government: '#2a78d6',
  Private: '#eb6834',
  Deemed: '#1baf7a',
}
const TYPES = Object.keys(TYPE_COLOR) as ValueRow['type'][]

type SortKey = 'ratio' | 'totalFee' | 'median' | 'name'

export default function ValueExplorer({ rows }: { rows: ValueRow[] }) {
  const available = PROGRAMMES.filter((p) => rows.filter((r) => r.programme === p.key).length >= 5)
  const [programme, setProgramme] = useState<Programme>(available[0]?.key ?? 'UG 4-year')
  const [types, setTypes] = useState<Set<ValueRow['type']>>(new Set(TYPES))
  const [officialOnly, setOfficialOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'ratio', asc: true })
  const [active, setActive] = useState<string | null>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) =>
      r.programme === programme && types.has(r.type) && (!officialOnly || r.feeOfficial) &&
      (!q || r.name.toLowerCase().includes(q) || r.place.toLowerCase().includes(q)))
    const dir = sort.asc ? 1 : -1
    return list.sort((a, b) => (sort.key === 'name' ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key]) * dir)
  }, [rows, programme, types, officialOnly, query, sort])

  const toggleType = (t: ValueRow['type']) =>
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t) && next.size > 1) next.delete(t)
      else next.add(t)
      return next
    })

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: key === 'ratio' || key === 'totalFee' || key === 'name' }))

  if (!available.length) {
    return <p className="text-gray-500">Not enough colleges have both a confirmed fee and placement data yet.</p>
  }

  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b)
    return s.length ? s[Math.floor(s.length / 2)] : 0
  }
  const typical = median(shown.map((r) => r.ratio))

  return (
    <div className="space-y-6">
      {/* Filters — one row */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Programme">
          {available.map((p) => (
            <button key={p.key} role="tab" aria-selected={programme === p.key} onClick={() => { setProgramme(p.key); setActive(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${programme === p.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={officialOnly} onChange={(e) => setOfficialOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Official fees only
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a college or city"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="font-semibold text-gray-900">Whole-course fee vs median salary</h2>
            <p className="text-sm text-gray-500">
              Dots above the line: graduates earn back the full fee within their first year&apos;s salary.
              {shown.length > 0 && <> Typical here: <span className="font-medium text-gray-700">{payback(typical)}</span>.</>}
            </p>
          </div>
          <div className="flex gap-3" aria-label="College type">
            {TYPES.map((t) => (
              <button key={t} type="button" onClick={() => toggleType(t)} aria-pressed={types.has(t)}
                className={`flex items-center gap-1.5 text-sm ${types.has(t) ? 'text-gray-700' : 'text-gray-300'}`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: types.has(t) ? TYPE_COLOR[t] : '#d1d5db' }} />
                {t}
              </button>
            ))}
          </div>
        </div>
        <Scatter rows={shown} active={active} setActive={setActive} />
      </section>

      {/* Table */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <Th label="College" k="name" sort={sort} onSort={setSortKey} className="text-left" />
                <Th label="Whole-course fee" k="totalFee" sort={sort} onSort={setSortKey} />
                <Th label="Median salary" k="median" sort={sort} onSort={setSortKey} />
                <Th label="Fee paid back in" k="ratio" sort={sort} onSort={setSortKey} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((r) => (
                <tr key={r.collegeId} onMouseEnter={() => setActive(r.collegeId)} onMouseLeave={() => setActive(null)}
                  className={active === r.collegeId ? 'bg-indigo-50/60' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLOR[r.type] }} aria-hidden />
                      <Link href={`/colleges/${r.slug}`} className="font-medium text-gray-900 hover:text-indigo-700">{r.name}</Link>
                    </div>
                    <p className="text-xs text-gray-400 ml-4">{r.type}{r.place ? ` · ${r.place}` : ''}{r.nirfRank ? ` · NIRF #${r.nirfRank}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-medium text-gray-900">{rupees(r.totalFee)}</span>
                    <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                      {rupees(r.annualFee)} a year ·{' '}
                      {r.feeOfficial
                        ? <span className="text-emerald-700 inline-flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" />official</span>
                        : <span className="text-amber-700">approx.</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-medium text-gray-900">{rupees(r.median)}</span>
                    <p className="text-xs text-gray-400">NIRF {r.placementYear}{r.placed ? ` · ${r.placed.toLocaleString('en-IN')} placed` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">{payback(r.ratio)}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No colleges match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-xs text-gray-500 leading-relaxed flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Salary</strong> is the median salary of the graduating batch as the college reported it to NIRF (the latest year
          we have). <strong>Fee</strong> is the course fee for the whole programme — <span className="text-emerald-700">official</span> when
          read from the college&apos;s own fee notice, <span className="text-amber-700">approx.</span> when not yet confirmed. Hostel and
          mess are not included, and reserved-category students often pay less. Colleges are left out when we can&apos;t match a fee to
          the same programme as the salary data. &ldquo;Paid back in&rdquo; is fee ÷ salary — a simple yardstick, not take-home pay.
        </p>
      </div>
    </div>
  )
}

function Th({ label, k, sort, onSort, className = 'text-right' }: {
  label: string; k: SortKey; sort: { key: SortKey; asc: boolean }; onSort: (k: SortKey) => void; className?: string
}) {
  const on = sort.key === k
  return (
    <th className={`px-4 py-3 font-medium ${className}`} aria-sort={on ? (sort.asc ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 hover:text-gray-800 ${on ? 'text-gray-800' : ''}`}>
        {label}
        {on && (sort.asc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </button>
    </th>
  )
}

/* ── Scatter: log–log, so "fee = one year's salary" is a straight diagonal ── */

const W = 760
const H = 400
const M = { top: 16, right: 20, bottom: 44, left: 64 }

function ticks(min: number, max: number): number[] {
  const out: number[] = []
  for (const base of [1e4, 1e5, 1e6, 1e7, 1e8]) for (const m of [1, 2, 5]) {
    const v = base * m
    if (v >= min && v <= max) out.push(v)
  }
  return out
}

function Scatter({ rows, active, setActive }: { rows: ValueRow[]; active: string | null; setActive: (id: string | null) => void }) {
  if (!rows.length) return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No colleges to plot.</div>

  const values = rows.flatMap((r) => [r.totalFee, r.median])
  const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...values)) * 2) / 2)
  const hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...values)) * 2) / 2)
  const xs = (v: number) => M.left + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (W - M.left - M.right)
  const ys = (v: number) => H - M.bottom - ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (H - M.top - M.bottom)
  const tk = ticks(lo, hi)
  const label = (v: number) => (v >= 1e7 ? `₹${v / 1e7}Cr` : v >= 1e5 ? `₹${v / 1e5}L` : `₹${v / 1e3}K`)
  const hot = rows.find((r) => r.collegeId === active)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label={`Scatter plot of ${rows.length} colleges: whole-course fee against median salary`}
        onMouseLeave={() => setActive(null)}>
        {/* grid */}
        {tk.map((v) => (
          <g key={v}>
            <line x1={xs(v)} x2={xs(v)} y1={M.top} y2={H - M.bottom} stroke="#eef0f3" />
            <line x1={M.left} x2={W - M.right} y1={ys(v)} y2={ys(v)} stroke="#eef0f3" />
            <text x={xs(v)} y={H - M.bottom + 18} textAnchor="middle" className="fill-gray-500" fontSize="11">{label(v)}</text>
            <text x={M.left - 8} y={ys(v) + 4} textAnchor="end" className="fill-gray-500" fontSize="11">{label(v)}</text>
          </g>
        ))}
        {/* fee = one year's salary */}
        <line x1={xs(lo)} y1={ys(lo)} x2={xs(hi)} y2={ys(hi)} stroke="#9ca3af" strokeWidth="1.5" />
        <text x={xs(hi) - 6} y={ys(hi) + 16} textAnchor="end" fontSize="11" className="fill-gray-500">fee = 1 year&apos;s salary</text>
        <text x={(M.left + W - M.right) / 2} y={H - 6} textAnchor="middle" fontSize="12" className="fill-gray-600">Whole-course fee →</text>
        <text transform={`translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" className="fill-gray-600">Median salary →</text>

        {rows.map((r) => {
          const on = active === r.collegeId
          return (
            <g key={r.collegeId} onMouseEnter={() => setActive(r.collegeId)} onClick={() => setActive(on ? null : r.collegeId)} className="cursor-pointer">
              <circle cx={xs(r.totalFee)} cy={ys(r.median)} r={12} fill="transparent" />
              <circle cx={xs(r.totalFee)} cy={ys(r.median)} r={on ? 7 : 5} fill={TYPE_COLOR[r.type]}
                stroke="#ffffff" strokeWidth="2" opacity={active && !on ? 0.35 : 1} />
            </g>
          )
        })}
      </svg>
      {hot && (
        <div className="pointer-events-none absolute z-10 bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-xs w-56"
          style={{
            left: `${Math.min(Math.max((xs(hot.totalFee) / W) * 100, 5), 70)}%`,
            top: `${Math.max((ys(hot.median) / H) * 100 - 28, 0)}%`,
          }}>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{hot.name}</p>
          <p className="text-gray-500 mb-1">{hot.type}{hot.place ? ` · ${hot.place}` : ''}</p>
          <p className="text-gray-700">Fee: <span className="font-medium">{rupees(hot.totalFee)}</span> {hot.feeOfficial ? '(official)' : '(approx.)'}</p>
          <p className="text-gray-700">Median salary: <span className="font-medium">{rupees(hot.median)}</span> (NIRF {hot.placementYear})</p>
          <p className="text-gray-700">Paid back in: <span className="font-medium">{payback(hot.ratio)}</span></p>
        </div>
      )}
    </div>
  )
}
