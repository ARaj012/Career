import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildValueRows, type CollegeIn, type CourseIn, type PlacementIn } from '@/lib/college-value'
import ValueExplorer from '@/components/college/ValueExplorer'

export const metadata: Metadata = {
  title: 'College fees vs placements | CareerGuide',
  description: 'Compare what a degree costs with the median salary its graduates get, college by college.',
}

export const revalidate = 3600

type Db = Awaited<ReturnType<typeof createServerSupabaseClient>>

/** Every row of a table (the API returns at most 1,000 per request). */
async function allRows<T>(db: Db, table: string, columns: string, filter?: (q: any) => any): Promise<T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(columns).range(from, from + 999)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error || !data) break
    out.push(...(data as T[]))
    if (data.length < 1000) break
  }
  return out
}

export default async function CollegeValuePage() {
  const db = await createServerSupabaseClient()
  const [colleges, courses, placements] = await Promise.all([
    allRows<CollegeIn>(db, 'colleges', 'id, name, slug, type, city, state, nirf_rank, nirf_category, annual_fees_min, annual_fees_max, fees_verified_at, fees_source_url, fee_note'),
    allRows<CourseIn>(db, 'college_courses', 'college_id, degree_type, duration_years, annual_fees_min, annual_fees_max, total_fees, source_type', (q) => q.eq('source_type', 'official')),
    allRows<PlacementIn>(db, 'college_placements', 'college_id, program_level, year, median_package, students_placed, source_type', (q) => q.eq('source_type', 'nirf').not('median_package', 'is', null)),
  ])
  const rows = buildValueRows(colleges, courses, placements)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/colleges" className="inline-flex items-center gap-1.5 text-sm text-indigo-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> All colleges
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Fees vs placements</h1>
          <p className="text-indigo-50 mt-2 max-w-2xl">
            What the whole course costs, next to the median salary its graduates got — and how long that salary takes to
            cover the fees. Same programme on both sides: a B.Tech fee is compared with B.Tech salaries.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ValueExplorer rows={rows} />
      </div>
    </main>
  )
}
