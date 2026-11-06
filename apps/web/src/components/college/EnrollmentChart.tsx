'use client'

import { BadgeCheck, Users } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'

interface EnrollmentRow {
  year: number
  total_students: number
  academic_year?: string | null
  source_url?: string | null
}

function formatStudents(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

/** Students enrolled in each academic year, as the institution reported it to NIRF. */
export default function EnrollmentChart({ data }: { data: EnrollmentRow[] }) {
  const rows = [...data].sort((a, b) => a.year - b.year)
  const chartData = rows.map((d) => ({ label: d.academic_year ?? `${d.year - 1}-${String(d.year).slice(2)}`, value: d.total_students }))
  const latest = rows.at(-1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Student Enrollment Trend
        </h2>
        {latest?.source_url && (
          <a href={latest.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
            <BadgeCheck className="w-3.5 h-3.5" /> Official · NIRF data sheet
          </a>
        )}
      </div>
      <SimpleBarChart
        data={chartData}
        barColorClass="bg-indigo-500"
        valueFormatter={formatStudents}
        emptyMessage="This institution has not reported its student strength to NIRF"
      />
      {rows.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          UG and PG students across all years of study, as reported by the institution to NIRF (Ministry of Education);
          PhD scholars are reported separately. Each NIRF edition reports the academic year before it.
        </p>
      )}
    </div>
  )
}
