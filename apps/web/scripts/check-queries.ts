// Runs every .from(table).select(...) in src/ against the database and lists any that fail (missing column or relationship).
// Usage (from apps/web): npx tsx scripts/check-queries.ts
import { config } from 'dotenv'
config({ path: '.env.local' })
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const files: string[] = []
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) { if (!/node_modules/.test(p)) walk(p) }
    else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) files.push(p)
  }
}
walk('src')
const QUOTES = String.fromCharCode(39) + String.fromCharCode(34) + String.fromCharCode(96)
const RE = new RegExp('\\.from\\(\\s*[' + QUOTES + ']([a-z_]+)[' + QUOTES + ']\\s*\\)\\s*\\.select\\(\\s*([' + QUOTES + '])([\\s\\S]*?)\\2', 'g')

;(async () => {
  const seen = new Set<string>()
  let n = 0
  let bad = 0
  for (const f of files) {
    const s = readFileSync(f, 'utf8')
    for (const m of s.matchAll(RE)) {
      const table = m[1]
      const cols = m[3]
      if (cols.includes('${')) continue
      const key = `${table}|${cols}`
      if (seen.has(key)) continue
      seen.add(key)
      n++
      const { error } = await db.from(table).select(cols.replace(/\s+/g, ' ')).limit(1)
      if (error) { bad++; console.log(`x ${f.replace(/\\/g, '/')}  ${table}: ${error.message}`) }
    }
  }
  console.log(`${n} distinct queries checked, ${bad} failing`)
})()
