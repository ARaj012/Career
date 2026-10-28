import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const count = async (q: any) => (await q).count
  const nirf = await count(db.from('college_placements').select('*', { count: 'exact', head: true }).eq('source_type', 'nirf'))
  const { data: rows } = await db.from('college_placements').select('college_id, year, median_package').eq('source_type', 'nirf').limit(10000)
  const colleges = new Set((rows ?? []).map((r) => r.college_id)).size
  const years = [...new Set((rows ?? []).map((r) => r.year))].sort()
  const pending = await count(db.from('automation_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'))
  const unver = await count(db.from('college_placements').select('*', { count: 'exact', head: true }).eq('source_type', 'unverified'))
  console.log({ nirf_rows: nirf, colleges_with_official_placements: colleges, years, with_median: (rows ?? []).filter((r) => r.median_package).length, pending_review: pending, unverified_rows_before_retire: unver })
  const { data: retired, error } = await db.rpc('retire_replaced_unverified')
  console.log('retire:', retired, error?.message ?? '')
  const unver2 = await count(db.from('college_placements').select('*', { count: 'exact', head: true }).eq('source_type', 'unverified'))
  console.log('unverified rows after:', unver2)
}
main()
