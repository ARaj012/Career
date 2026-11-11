/**
 * Loads supabase/estimates/estimates.json (built by supabase/estimates/build.py) into
 * public.data_estimates. Records are matched by name or slug; re-running updates the text.
 *   python supabase/estimates/build.py
 *   npx tsx scripts/load-estimates.ts            # from apps/web
 *   npx tsx scripts/load-estimates.ts --dry-run
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

type Row = {
  entity: string; table: string; col: string; match: string; field: string; kind: string
  value_text: string; basis: string | null; source_name: string | null; source_url: string | null
  value_min: number | null; value_max: number | null
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  const db = createClient(url, key, { auth: { persistSession: false } })
  const rows = JSON.parse(readFileSync(resolve(__dirname, '../../../supabase/estimates/estimates.json'), 'utf8')) as Row[]

  // name/slug → id, per table
  const ids = new Map<string, string>()
  for (const t of [...new Set(rows.map((r) => `${r.table}.${r.col}`))]) {
    const [table, col] = t.split('.')
    const { data, error } = await db.from(table).select(`id, ${col}`)
    if (error) throw new Error(`${table}: ${error.message}`)
    for (const r of (data ?? []) as unknown as Record<string, string>[]) ids.set(`${table}.${col}.${r[col]}`, r.id)
  }

  const missing = rows.filter((r) => !ids.has(`${r.table}.${r.col}.${r.match}`))
  for (const m of missing) console.log(`  ⚠️ no ${m.table} with ${m.col} = "${m.match}"`)
  const records = rows
    .filter((r) => ids.has(`${r.table}.${r.col}.${r.match}`))
    .map((r) => ({
      entity: r.entity, record_id: ids.get(`${r.table}.${r.col}.${r.match}`)!, field: r.field, kind: r.kind,
      value_text: r.value_text, basis: r.basis, source_name: r.source_name, source_url: r.source_url,
      value_min: r.value_min, value_max: r.value_max, updated_at: new Date().toISOString(),
    }))
  console.log(`${records.length} estimates to load (${missing.length} unmatched)`)
  if (dryRun) return
  for (let i = 0; i < records.length; i += 200) {
    const { error } = await db.from('data_estimates').upsert(records.slice(i, i + 200), { onConflict: 'entity,record_id,field' })
    if (error) throw new Error(error.message)
  }
  console.log('loaded')
}
main().catch((e) => { console.error(e); process.exit(1) })
