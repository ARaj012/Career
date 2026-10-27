import { TrendingUp, Briefcase, BadgeCheck, AlertTriangle } from 'lucide-react'
import { batchLabel, formatPackage, isOfficial, levelLabel, officialLevels, type PlacementRow } from '@/lib/placements'

function Stat({ value, label, tone = 'gray' }: { value: string | null; label: string; tone?: 'gray' | 'emerald' | 'amber' }) {
  if (!value) return null
  const tones = { gray: 'bg-gray-50 text-gray-800', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700' }
  return (
    <div className={`rounded-lg p-3 text-center ${tones[tone]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}

/** Sidebar placement box: official NIRF figures first, third-party numbers only when labelled. */
export default function PlacementSummary({ rows }: { rows: PlacementRow[] }) {
  const levels = officialLevels(rows)
  const latestOf = (level: string) =>
    rows.filter((r) => isOfficial(r) && r.program_level === level).sort((a, b) => b.year - a.year)[0]
  const unverified = rows.filter((r) => !isOfficial(r)).sort((a, b) => b.year - a.year)[0]
  if (!levels.length && !unverified) return null

  const main = levels.length ? latestOf(levels[0]) : null
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-500" /> Placements
      </h2>

      {main && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            {levelLabel(main.program_level)}, batch {batchLabel(main.year)}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Stat value={formatPackage(main.median_package)} label="Median package" tone="emerald" />
            <Stat value={main.placement_rate !== null ? `${main.placement_rate}%` : null} label="Placed" />
            <Stat
              value={main.students_placed !== null && main.total_eligible_students ? `${main.students_placed}/${main.total_eligible_students}` : null}
              label="Placed / graduated"
            />
            <Stat value={main.higher_studies !== null ? String(main.higher_studies) : null} label="Higher studies" />
          </div>
          {levels.slice(1).length > 0 && (
            <ul className="text-xs text-gray-600 space-y-1 mb-3">
              {levels.slice(1).map((level) => {
                const r = latestOf(level)
                return (
                  <li key={level} className="flex justify-between gap-2">
                    <span>{levelLabel(level)}</span>
                    <span className="font-medium text-gray-800">
                      {formatPackage(r.median_package) ?? '—'}
                      {r.placement_rate !== null ? ` · ${r.placement_rate}%` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <a
            href={main.source_url ?? 'https://www.nirfindia.org'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
          >
            <BadgeCheck className="w-3.5 h-3.5" /> Official · data submitted to NIRF (Ministry of Education)
          </a>
        </>
      )}

      {unverified && (unverified.average_package || unverified.highest_package) && (
        <div className={main ? 'mt-4 pt-4 border-t border-gray-100' : 'mt-2'}>
          <p className="flex items-start gap-1.5 text-xs text-amber-700 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Unverified {unverified.year} figures from third-party sites; not confirmed by the college or NIRF.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Stat value={formatPackage(unverified.average_package)} label="Average (unverified)" />
            <Stat value={formatPackage(unverified.highest_package)} label="Highest (unverified)" tone="amber" />
          </div>
        </div>
      )}

      {(main?.top_recruiters || unverified?.top_recruiters) && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Top Recruiters
          </p>
          <p className="text-sm text-gray-600">{main?.top_recruiters ?? unverified?.top_recruiters}</p>
        </div>
      )}
    </div>
  )
}
