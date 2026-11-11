/**
 * Every change the automation wants to make becomes a "proposal" with
 * evidence. Then the policy decides:
 *
 *   AUTOMATION_AUTO_APPLY=safe (default)
 *     auto-apply when the source is official AND the change only fills an
 *     empty value / replaces unverified legacy data. Changing a value that
 *     was already verified waits for one-click admin approval.
 *   AUTOMATION_AUTO_APPLY=all   auto-apply anything from an official source
 *   AUTOMATION_AUTO_APPLY=none  everything waits for review
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Change = { old: unknown; new: unknown; evidence: string | null }

export type ProposalInput = {
  entity: 'exam_schedule' | 'scholarship' | 'college' | 'career'
  table: string
  recordId: string | null              // null = insert new row
  parentId?: string | null
  label: string
  fields: Record<string, Change>
  insertKey?: Record<string, unknown>  // columns to set when inserting (e.g. exam_id, year, session)
  extra?: Record<string, unknown>      // provenance columns written on apply
  sourceUrl: string
  official: boolean
  overwritesVerified: boolean
  forceReview?: string                 // reason to always queue
}

export type ProposalOutcome = 'auto_applied' | 'pending' | 'duplicate' | 'failed'

const POLICY = (process.env.AUTOMATION_AUTO_APPLY || 'safe').toLowerCase()

function sha(s: string) {
  return createHash('sha256').update(s).digest('hex').slice(0, 24)
}

function decide(p: ProposalInput): { auto: boolean; reason: string | null } {
  if (p.forceReview) return { auto: false, reason: p.forceReview }
  if (!p.official) return { auto: false, reason: 'Source is not on the official website' }
  if (POLICY === 'none') return { auto: false, reason: 'Auto-apply disabled (AUTOMATION_AUTO_APPLY=none)' }
  if (POLICY === 'safe' && p.overwritesVerified) return { auto: false, reason: 'Would change a value that was already verified' }
  return { auto: true, reason: null }
}

/** The row that already has this key (e.g. same exam, year and session), if any. */
async function existingRow(db: SupabaseClient, table: string, key: Record<string, unknown>): Promise<string | null> {
  const entries = Object.entries(key)
  if (!entries.length) return null
  let q = db.from(table).select('id')
  for (const [k, v] of entries) q = v === null || v === undefined ? q.is(k, null) : q.eq(k, v as string | number | boolean)
  const { data } = await q.limit(2)
  return data?.length === 1 ? (data[0].id as string) : null
}

export class RowExistsError extends Error {}

/**
 * Writes a change. A proposed new row whose key is already taken (another reading or an
 * admin added that exam/year/session in the meantime) updates that row when an admin
 * approves (`onExisting: 'update'`); automatic applying stops instead, so the change waits
 * for review rather than silently overwriting a row that may have been checked by hand.
 */
export async function applyChange(
  db: SupabaseClient,
  table: string,
  recordId: string | null,
  values: Record<string, unknown>,
  insertKey: Record<string, unknown> = {},
  opts: { onExisting?: 'update' | 'stop' } = {}
): Promise<string | null> {
  if (!recordId) {
    const existing = await existingRow(db, table, insertKey)
    if (existing && opts.onExisting === 'update') recordId = existing
    else if (existing) throw new RowExistsError(`${table}: a row for this ${Object.keys(insertKey).join('/')} already exists; approve to update it with these official values`)
  }
  if (recordId) {
    const { error } = await db.from(table).update(values).eq('id', recordId)
    if (error) throw new Error(`${table} update failed: ${error.message}`)
    return recordId
  }
  const { data, error } = await db.from(table).insert({ ...insertKey, ...values }).select('id').single()
  if (error) throw new Error(`${table} insert failed: ${error.message}`)
  return data?.id ?? null
}

export async function submitProposal(
  db: SupabaseClient,
  runId: string | null,
  p: ProposalInput,
  dryRun: boolean
): Promise<ProposalOutcome> {
  if (Object.keys(p.fields).length === 0) return 'duplicate'

  const target = sha(`${p.table}|${p.recordId ?? JSON.stringify(p.insertKey ?? {})}`)
  const values = Object.fromEntries(Object.entries(p.fields).map(([k, c]) => [k, c.new]))
  const fingerprint = `${target}:${sha(JSON.stringify(values))}`
  const { auto, reason } = decide(p)

  if (dryRun) {
    console.log(`    ${auto ? '✅ would auto-apply' : '📝 would queue'}: ${p.label}`, values, reason ? `(${reason})` : '')
    return auto ? 'auto_applied' : 'pending'
  }

  // Same change already waiting, or already rejected by an admin? Skip it.
  const { data: dup } = await db
    .from('automation_proposals')
    .select('id')
    .eq('fingerprint', fingerprint)
    .in('status', ['pending', 'rejected'])
    .limit(1)
    .maybeSingle()
  if (dup) return 'duplicate'

  // A newer reading replaces older pending proposals for the same row.
  await db
    .from('automation_proposals')
    .update({ status: 'superseded' })
    .like('fingerprint', `${target}:%`)
    .eq('status', 'pending')

  const row = {
    run_id: runId,
    entity: p.entity,
    table_name: p.table,
    record_id: p.recordId,
    parent_id: p.parentId ?? null,
    label: p.label,
    changes: { fields: p.fields, extra: p.extra ?? {}, insertKey: p.insertKey ?? {} },
    match_key: p.insertKey ?? {},
    source_url: p.sourceUrl,
    confidence: p.official ? 1 : 0.5,
    status: auto ? 'auto_applied' : 'pending',
    reason,
    fingerprint,
  }

  if (auto) {
    try {
      const id = await applyChange(db, p.table, p.recordId, { ...values, ...(p.extra ?? {}) }, p.insertKey)
      await db.from('automation_proposals').insert({ ...row, record_id: id, reviewed_at: new Date().toISOString(), reviewed_by: 'automation' })
      return 'auto_applied'
    } catch (err) {
      const exists = err instanceof RowExistsError
      if (!exists) console.error(`    ❌ ${p.label}:`, (err as Error).message)
      await db.from('automation_proposals').insert({ ...row, status: 'pending', reason: exists ? `Needs review: ${(err as Error).message}` : `Auto-apply failed: ${(err as Error).message}` })
      return exists ? 'pending' : 'failed'
    }
  }

  const { error } = await db.from('automation_proposals').insert(row)
  if (error) {
    console.error(`    ❌ could not queue ${p.label}:`, error.message)
    return 'failed'
  }
  return 'pending'
}

/** Used by the admin "Approve" button. */
export async function approveProposal(db: SupabaseClient, id: string, reviewer: string) {
  const { data: p, error } = await db.from('automation_proposals').select('*').eq('id', id).single()
  if (error || !p) throw new Error('Proposal not found')
  if (p.status !== 'pending') throw new Error(`Proposal is already ${p.status}`)
  const fields = (p.changes?.fields ?? {}) as Record<string, Change>
  const values = Object.fromEntries(Object.entries(fields).map(([k, c]) => [k, c.new]))
  // An admin approving a new row whose exam/year/session (etc.) already exists updates that row
  const recordId = await applyChange(db, p.table_name, p.record_id, { ...values, ...(p.changes?.extra ?? {}) }, p.changes?.insertKey ?? {}, { onExisting: 'update' })
  await db
    .from('automation_proposals')
    .update({ status: 'applied', record_id: recordId, reviewed_at: new Date().toISOString(), reviewed_by: reviewer })
    .eq('id', id)
}

export async function rejectProposal(db: SupabaseClient, id: string, reviewer: string) {
  await db
    .from('automation_proposals')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: reviewer })
    .eq('id', id)
    .eq('status', 'pending')
}
