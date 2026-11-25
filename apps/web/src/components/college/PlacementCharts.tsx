'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown, BadgeCheck, AlertTriangle } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'
import { batchLabel, COURSE_PREFIX, formatPackage, isCourseRow, isOfficial, levelLabel, officialLevels, type PlacementRow } from '@/lib/placements'

const pkg = (n: number) => formatPackage(n) ?? ''
const pct = (part: number, whole: number) => Math.round((part / whole) * 1000) / 10

export default function PlacementCharts({ data }: { data: PlacementRow[] }) {
  const [open, setOpen] = useState(false)
  const levels = officialLevels(data)
  const [level, setLevel] = useState(levels[0])

  // Official series for the chosen program level, last 5 graduating batches; never invent years
  const official = data.filter((d) => isOfficial(d) && d.program_level === level).sort((a, b) => a.year - b.year).slice(-5)
  const medianData = official.filter((d) => d.median_package).map((d) => ({ label: batchLabel(d.year), value: d.median_package as number }))
  const rateData = official.filter((d) => d.placement_rate).map((d) => ({ label: batchLabel(d.year), value: d.placement_rate as number }))
  // Programmes whose graduates mostly go on to study further (e.g. B.Stat → M.Stat) show that instead
  const studyData = official
    .filter((d) => d.higher_studies && d.total_eligible_students)
    .map((d) => ({ label: batchLabel(d.year), value: pct(d.higher_studies!, d.total_eligible_students!) }))

  const courses = data
    .filter((d) => isOfficial(d) && isCourseRow(d))
    .sort((a, b) => b.year - a.year || a.program_level.localeCompare(b.program_level))
  const courseSources = [...new Map(courses.filter((c) => c.source_url).map((c) => [c.source_url, c.notes])).entries()]

  const unverified = data.filter((d) => !isOfficial(d)).sort((a, b) => a.year - b.year).slice(-5)
  const avgData = unverified.filter((d) => d.average_package).map((d) => ({ label: `${d.year}`, value: d.average_package as number }))
  const highData = unverified.filter((d) => d.highest_package).map((d) => ({ label: `${d.year}`, value: d.highest_package as number }))

  if (!official.length && !courses.length && !avgData.length && !highData.length) return null
  const years = Math.max(official.length, unverified.length)
  const cell = 'px-3 py-2 text-right tabular-nums whitespace-nowrap'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {years >= 2 ? `Placement Trends (Last ${years} Years)` : 'Placement Data'}
        </h2>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-8 border-t border-gray-100 pt-6">
          {official.length > 0 && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <BadgeCheck className="w-3.5 h-3.5" /> Official data the institution reported to NIRF, by graduating batch
                </p>
                {levels.length > 1 && (
                  <div className="flex flex-wrap gap-1" role="tablist" aria-label="Program level">
                    {levels.map((l) => (
                      <button
                        key={l}
                        role="tab"
                        aria-selected={l === level}
                        onClick={() => setLevel(l)}
                        className={`px-2.5 py-1 text-xs rounded-full border ${l === level ? 'bg-emerald-700 border-emerald-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {levelLabel(l)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-3 py-2 text-left font-medium">Graduating batch</th>
                      <th className="px-3 py-2 text-right font-medium">Graduates</th>
                      <th className="px-3 py-2 text-right font-medium">Placed</th>
                      <th className="px-3 py-2 text-right font-medium">Higher studies</th>
                      <th className="px-3 py-2 text-right font-medium">Median salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...official].reverse().map((d) => (
                      <tr key={d.year}>
                        <td className="px-3 py-2 font-medium text-gray-900">{batchLabel(d.year)}</td>
                        <td className={cell}>{d.total_eligible_students ?? '—'}</td>
                        <td className={cell}>
                          {d.students_placed ?? '—'}
                          {d.placement_rate != null && <span className="text-gray-500"> ({d.placement_rate}%)</span>}
                        </td>
                        <td className={cell}>{d.higher_studies ?? '—'}</td>
                        <td className={`${cell} font-semibold text-gray-900`}>{formatPackage(d.median_package) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {official.some((d) => d.notes) && (
                <p className="text-xs text-gray-500">{official.find((d) => d.notes)?.notes}</p>
              )}

              {medianData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Median package · {levelLabel(level)}</h3>
                  <SimpleBarChart data={medianData} barColorClass="bg-emerald-500" valueFormatter={pkg} />
                </div>
              )}
              {rateData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Students placed (% of graduates) · {levelLabel(level)}</h3>
                  <SimpleBarChart data={rateData} barColorClass="bg-indigo-500" valueFormatter={(v) => `${v}%`} />
                </div>
              )}
              {studyData.length > 0 && !rateData.length && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Went on to higher studies (% of graduates) · {levelLabel(level)}</h3>
                  <SimpleBarChart data={studyData} barColorClass="bg-sky-500" valueFormatter={(v) => `${v}%`} />
                </div>
              )}
            </section>
          )}

          {courses.length > 0 && (
            <section className="space-y-3">
              <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <BadgeCheck className="w-3.5 h-3.5" /> Course-wise placements, from the institute&apos;s own reports
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-3 py-2 text-left font-medium">Programme</th>
                      <th className="px-3 py-2 text-left font-medium">Batch</th>
                      <th className="px-3 py-2 text-right font-medium">Sought jobs</th>
                      <th className="px-3 py-2 text-right font-medium">Offered jobs</th>
                      <th className="px-3 py-2 text-right font-medium">Median</th>
                      <th className="px-3 py-2 text-right font-medium">Average</th>
                      <th className="px-3 py-2 text-right font-medium">Highest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courses.map((d) => (
                      <tr key={`${d.program_level}-${d.year}`}>
                        <td className="px-3 py-2 font-medium text-gray-900">{d.program_level.slice(COURSE_PREFIX.length)}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{batchLabel(d.year)}</td>
                        <td className={cell}>{d.total_eligible_students ?? '—'}</td>
                        <td className={cell}>{d.students_placed ?? '—'}</td>
                        <td className={`${cell} font-semibold text-gray-900`}>{formatPackage(d.median_package) ?? '—'}</td>
                        <td className={cell}>{formatPackage(d.average_package) ?? '—'}</td>
                        <td className={cell}>{formatPackage(d.highest_package) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="text-xs text-gray-500 space-y-1">
                {courseSources.map(([url, note]) => (
                  <li key={url}>
                    {note ? `${note} ` : ''}
                    <a href={url!} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Source</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(avgData.length > 0 || highData.length > 0) && (
            <section className="space-y-6">
              <p className="flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Average and highest packages below come from third-party sites and are not verified. NIRF publishes only the median.
              </p>
              {avgData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Average package (unverified)</h3>
                  <SimpleBarChart data={avgData} barColorClass="bg-gray-400" valueFormatter={pkg} />
                </div>
              )}
              {highData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Highest package (unverified)</h3>
                  <SimpleBarChart data={highData} barColorClass="bg-amber-400" valueFormatter={pkg} />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
