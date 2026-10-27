/**
 * Data automation CLI — keeps exams, scholarships and NIRF ranks in sync
 * with official websites. Used by GitHub Actions; also runnable locally.
 *
 *   npx tsx scripts/automation.ts                      # full run
 *   npx tsx scripts/automation.ts --mode=hot           # only exams with open/near dates
 *   npx tsx scripts/automation.ts --slug=gate --dry-run
 *   npx tsx scripts/automation.ts --only=scholarships --limit=10 --force
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
 * Optional: AUTOMATION_AUTO_APPLY=safe|all|none, AUTOMATION_MODEL
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { runAutomation, type RunOptions } from '../src/lib/automation/engine/runner'

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
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is required (free key: console.groq.com/keys)')
    process.exit(1)
  }

  const slug = arg('slug')
  const only = arg('only')
  const opts: RunOptions = {
    targets: only ? (only.split(',') as RunOptions['targets']) : slug ? ['exams'] : ['exams', 'scholarships', 'colleges', 'nirf'],
    mode: slug ? 'single' : ((arg('mode') as RunOptions['mode']) ?? 'full'),
    slug,
    limit: arg('limit') ? Number(arg('limit')) : undefined,
    dryRun: arg('dry-run') === 'true',
    force: arg('force') === 'true',
    trigger: process.env.GITHUB_ACTIONS ? 'github' : 'manual',
  }
  console.log('🚀 Automation starting', opts)

  const db = createClient(url, key, { auth: { persistSession: false } })
  const result = await runAutomation(db, opts)
  // Non-zero exit only when the whole run failed, so GitHub shows a red X when it matters
  process.exit(result.status === 'failed' ? 1 : 0)
}

main().catch((err) => {
  console.error('❌ Automation crashed:', err)
  process.exit(1)
})
