import Link from 'next/link'
import { BadgeCheck, GraduationCap } from 'lucide-react'

export type InstituteScholarship = { name: string; detail: string; source_url: string | null }
export type LinkedScholarship = { match_type: string | null; relevance_note: string | null; name: string; slug: string | null; provider: string | null }

/**
 * Summary of scholarships for students of this college (the full list is /colleges/[slug]/scholarships): the institute's own schemes (read from its
 * website by the automation, in its own words) and the government schemes they can apply to.
 */
export default function CollegeScholarshipsSummary({ own, linked, collegeSlug }: { own: InstituteScholarship[]; linked: LinkedScholarship[]; collegeSlug: string }) {
  if (!own.length && !linked.length) return null
  // State schemes first: they are the ones a student is most likely to miss
  const ORDER: Record<string, number> = { state: 0, institute: 1, national: 2 }
  const schemes = [...linked].sort((a, b) => (ORDER[a.match_type ?? ''] ?? 3) - (ORDER[b.match_type ?? ''] ?? 3)).slice(0, 10)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-indigo-500" /> Scholarships
      </h2>
      <p className="text-sm text-gray-500 mb-4">Fee waivers and scholarships for students here.</p>

      {own.length > 0 && (
        <section className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            Offered by the institute <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
          </h3>
          <ul className="space-y-2">
            {own.map((s) => (
              <li key={s.name} className="text-sm text-gray-700 leading-relaxed pl-3 border-l-2 border-emerald-200">
                <span className="font-medium text-gray-900">{s.name}: </span>
                {s.detail}
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-xs text-emerald-700 hover:underline">(official)</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {schemes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Government scholarships you can apply for</h3>
          <ul className="divide-y divide-gray-100">
            {schemes.map((s) => (
              <li key={s.name} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {s.slug ? (
                    <Link href={`/scholarships/${s.slug}`} className="text-sm font-medium text-indigo-600 hover:underline">{s.name}</Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                  )}
                  {s.provider && <p className="text-xs text-gray-500">{s.provider}</p>}
                </div>
                {s.match_type && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{s.match_type}</span>
                )}
              </li>
            ))}
          </ul>
          <Link href={`/colleges/${collegeSlug}/scholarships`} className="mt-2 inline-block text-xs text-indigo-600 hover:underline">
            See all {linked.length} scholarships, with amounts, deadlines and eligibility →
          </Link>
        </section>
      )}
    </div>
  )
}
