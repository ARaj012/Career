/**
 * Previous-year papers: reads every exam's official website for question
 * papers, answer keys and sample papers, and stores the links. No AI.
 *
 *   npx tsx scripts/papers.ts                 # exams not checked in the last 25 days
 *   npx tsx scripts/papers.ts --force         # every exam
 *   npx tsx scripts/papers.ts --slug=jee-advanced --dry-run
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (!hit) return undefined
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : 'true'
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    process.exit(1)
  }
  const db = createClient(url, key, { auth: { persistSession: false } })
  const { updatePapers } = await import('../src/lib/automation/engine/papers')

  const slug = arg('slug')
  const dryRun = arg('dry-run') === 'true'
  const force = arg('force') === 'true'
  const limit = arg('limit') ? Number(arg('limit')) : undefined

  let q = db.from('exams').select('id, name, slug, official_url, source_urls, papers_checked_at').not('official_url', 'is', null)
  if (slug) q = q.eq('slug', slug)
  const { data, error } = await q.order('papers_checked_at', { ascending: true, nullsFirst: true })
  if (error) throw error
  const cutoff = Date.now() - 25 * 86_400_000
  let exams = (data ?? []).filter((e) => slug || force || !e.papers_checked_at || new Date(e.papers_checked_at).getTime() < cutoff)
  if (limit) exams = exams.slice(0, limit)
  console.log(`📄 Previous papers: ${exams.length} exams to check${dryRun ? ' (dry run)' : ''}`)

  let found = 0
  let added = 0
  let withPapers = 0
  for (const exam of exams) {
    try {
      const r = await updatePapers(db, exam, dryRun)
      found += r.found
      added += r.added
      if (r.found) withPapers++
      console.log(`  ${r.found ? '✅' : '·'} ${exam.slug}: ${r.found} found, ${r.added} new${r.removed ? `, ${r.removed} removed` : ''}${r.errors.length ? ` (${r.errors.length} pages unreadable)` : ''}`)
    } catch (err) {
      console.log(`  ❌ ${exam.slug}: ${(err as Error).message}`)
    }
  }
  console.log(`Summary: ${withPapers}/${exams.length} exams have papers on their official site; ${found} links, ${added} new`)
}

main().catch((err) => {
  console.error('❌ Papers reader crashed:', err)
  process.exit(1)
})
