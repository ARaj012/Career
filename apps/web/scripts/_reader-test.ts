import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

async function main() {
  const { updateCollegeDetails } = await import('../src/lib/automation/engine/college-details')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db
    .from('colleges')
    .select('id, name, website_url, admission_process, admission_verified_at, annual_fees_min, annual_fees_max, fees_verified_at, institute_scholarships')
    .in('name', process.argv.slice(2))
  for (const c of data ?? []) {
    console.log(`\n=================== ${c.name} (${c.website_url})`)
    const r = await updateCollegeDetails(db, c, { runId: null, dryRun: true, force: true })
    console.log('skipped:', r.skipped ?? '-', '| fetch errors:', r.errors.length)
    for (const d of r.dropped) console.log('   DROPPED', d)
  }
}
main()
