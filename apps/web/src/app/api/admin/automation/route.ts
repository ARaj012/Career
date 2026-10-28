import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { logAdminAction } from '@/lib/admin-audit'
import { approveProposal, rejectProposal } from '@/lib/automation/engine/proposals'
import { runAutomation } from '@/lib/automation/engine/runner'

// Serverless hosts cap request time; "Run now" stops starting new records before this.
// Updating one college reads ~15 pages of its site, so it gets longer (the host caps it at its plan limit).
export const maxDuration = 300

const SWEEP_TARGETS = ['exams', 'scholarships', 'college_details', 'colleges', 'syllabus', 'exam_cutoffs', 'nirf'] as const
type SweepTarget = (typeof SWEEP_TARGETS)[number]

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const db = createAdminSupabaseClient()
  const [proposals, runs, counts] = await Promise.all([
    db.from('automation_proposals').select('*').eq('status', status).order('created_at', { ascending: false }).limit(200),
    db.from('automation_runs').select('*').order('started_at', { ascending: false }).limit(10),
    db.from('automation_proposals').select('status'),
  ])
  if (proposals.error) {
    return NextResponse.json(
      { error: `${proposals.error.message}. Run supabase/automation-v2.sql in the Supabase SQL editor first.` },
      { status: 500 }
    )
  }
  const tally: Record<string, number> = {}
  for (const r of counts.data ?? []) tally[r.status] = (tally[r.status] ?? 0) + 1

  return NextResponse.json({ proposals: proposals.data, runs: runs.data ?? [], counts: tally })
}

type Body =
  | { action: 'approve' | 'reject'; ids: string[] }
  | { action: 'run'; slug?: string; target?: 'exams' | 'scholarships' | 'nirf' }
  // One batch of "Update everything"; the page repeats it until remaining is 0
  | { action: 'sweep'; target: SweepTarget; startedAt: string; runId?: string }
  | { action: 'college'; collegeId: string }

export async function POST(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = user.email || 'admin'
  const body = (await request.json()) as Body
  const db = createAdminSupabaseClient()

  if (body.action === 'approve' || body.action === 'reject') {
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 200) : []
    if (!ids.length) return NextResponse.json({ error: 'ids required' }, { status: 400 })
    const done: string[] = []
    const failed: { id: string; error: string }[] = []
    for (const id of ids) {
      try {
        const { data: p } = await db.from('automation_proposals').select('table_name, record_id, changes').eq('id', id).single()
        if (body.action === 'approve') await approveProposal(db, id, email)
        else await rejectProposal(db, id, email)
        done.push(id)
        if (p) {
          const fields = (p.changes?.fields ?? {}) as Record<string, { old: unknown; new: unknown }>
          await logAdminAction({
            adminEmail: email,
            actionType: body.action === 'approve' ? (p.record_id ? 'update' : 'create') : 'view',
            tableName: p.table_name,
            recordId: p.record_id ?? undefined,
            oldValues: Object.fromEntries(Object.entries(fields).map(([k, c]) => [k, c.old])),
            newValues: body.action === 'approve' ? Object.fromEntries(Object.entries(fields).map(([k, c]) => [k, c.new])) : { rejected_proposal: id },
          })
        }
      } catch (err) {
        failed.push({ id, error: err instanceof Error ? err.message : 'failed' })
      }
    }
    // An approved official value replaces the old unverified one straight away
    if (body.action === 'approve' && done.length) await db.rpc('retire_replaced_unverified')
    return NextResponse.json({ done, failed })
  }

  if (body.action === 'run') {
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server' }, { status: 400 })
    try {
      const result = await runAutomation(db, {
        targets: body.slug ? ['exams'] : [body.target ?? 'exams'],
        mode: body.slug ? 'single' : 'hot',
        slug: body.slug,
        force: !!body.slug,
        trigger: 'manual',
        limit: body.slug ? undefined : 8,
        deadlineMs: Date.now() + 45_000,
      })
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Run failed' }, { status: 500 })
    }
  }

  if (body.action === 'sweep') {
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server' }, { status: 400 })
    if (!SWEEP_TARGETS.includes(body.target) || Number.isNaN(Date.parse(body.startedAt))) {
      return NextResponse.json({ error: 'target and startedAt required' }, { status: 400 })
    }
    try {
      const result = await runAutomation(db, {
        targets: [body.target],
        mode: 'full',
        trigger: 'manual',
        sweepStartedAt: body.startedAt,
        runId: body.runId,
        notify: false,
        deadlineMs: Date.now() + 30_000, // one slow site can add ~15 s; stays under maxDuration
      })
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Run failed' }, { status: 500 })
    }
  }

  // One college, on demand: courses, fees, placements, admission, then NAAC/founded
  if (body.action === 'college') {
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server' }, { status: 400 })
    if (!/^[0-9a-f-]{36}$/i.test(body.collegeId ?? '')) return NextResponse.json({ error: 'collegeId required' }, { status: 400 })
    try {
      const result = await runAutomation(db, {
        targets: ['college_details', 'colleges'],
        mode: 'single',
        collegeId: body.collegeId,
        force: true,
        trigger: 'manual',
        notify: false,
      })
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Run failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
