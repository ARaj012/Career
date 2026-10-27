'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown, BadgeCheck, AlertTriangle } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'
import { batchLabel, formatPackage, isOfficial, levelLabel, officialLevels, type PlacementRow } from '@/lib/placements'

const pkg = (n: number) => formatPackage(n) ?? ''

export default function PlacementCharts({ data }: { data: PlacementRow[] }) {
  const [open, setOpen] = useState(false)
  const levels = officialLevels(data)
  const [level, setLevel] = useState(levels[0])

  // Official series for the chosen program level, last 5 graduating batches; never invent years
  const official = data.filter((d) => isOfficial(d) && d.program_level === level).sort((a, b) => a.year - b.year).slice(-5)
  const medianData = official.filter((d) => d.median_package).map((d) => ({ label: batchLabel(d.year), value: d.median_package as number }))
  const rateData = official.filter((d) => d.placement_rate).map((d) => ({ label: batchLabel(d.year), value: d.placement_rate as number }))

  const unverified = data.filter((d) => !isOfficial(d)).sort((a, b) => a.year - b.year).slice(-5)
  const avgData = unverified.filter((d) => d.average_package).map((d) => ({ label: `${d.year}`, value: d.average_package as number }))
  const highData = unverified.filter((d) => d.highest_package).map((d) => ({ label: `${d.year}`, value: d.highest_package as number }))

  if (!medianData.length && !rateData.length && !avgData.length && !highData.length) return null
  const years = Math.max(official.length, unverified.length)

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
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-8 border-t border-gray-100 pt-6">
          {(medianData.length > 0 || rateData.length > 0) && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <BadgeCheck className="w-3.5 h-3.5" /> Official NIRF data, by graduating batch
                </p>
                {levels.length > 1 && (
                  <div className="flex flex-wrap gap-1" role="tablist" aria-label="Program level">
                    {levels.map((l) => (
                      <button
                        key={l}
                        role="tab"
                        aria-selected={l === level}
                        onClick={() => setLevel(l)}
                        className={`px-2.5 py-1 text-xs rounded-full border ${l === level ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {levelLabel(l)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
