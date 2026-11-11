import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { applyChange, RowExistsError } from './proposals'

/** A tiny in-memory stand-in for one table, enough for applyChange's queries. */
function fakeDb(rows: Record<string, unknown>[]) {
  const log: string[] = []
  const query = (filters: [string, unknown][] = []) => ({
    eq: (k: string, v: unknown) => query([...filters, [k, v]]),
    is: (k: string, v: unknown) => query([...filters, [k, v]]),
    limit: async () => ({ data: rows.filter((r) => filters.every(([k, v]) => (r[k] ?? null) === v)).map((r) => ({ id: r.id })) }),
  })
  const db = {
    from: () => ({
      select: () => query(),
      update: (values: Record<string, unknown>) => ({
        eq: async (_k: string, id: string) => {
          log.push(`update ${id}`)
          Object.assign(rows.find((r) => r.id === id)!, values)
          return { error: null }
        },
      }),
      insert: (row: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            if (rows.some((r) => r.exam_id === row.exam_id && r.year === row.year && r.session === row.session))
              return { data: null, error: { message: 'duplicate key value violates unique constraint' } }
            log.push('insert')
            rows.push({ id: 'new', ...row })
            return { data: { id: 'new' }, error: null }
          },
        }),
      }),
    }),
  }
  return { db: db as unknown as SupabaseClient, rows, log }
}

const key = { exam_id: 'e1', year: 2027, session: 'Session 1' }

describe('applying a proposed new row', () => {
  it('updates the existing row when an admin approves it', async () => {
    const { db, rows, log } = fakeDb([{ id: 'r1', ...key, registration_end: null }])
    const id = await applyChange(db, 'exam_schedules', null, { registration_end: '2027-01-24' }, key, { onExisting: 'update' })
    expect(id).toBe('r1')
    expect(log).toEqual(['update r1'])
    expect(rows).toHaveLength(1)
    expect(rows[0].registration_end).toBe('2027-01-24')
  })

  it('stops for review instead of overwriting when applied automatically', async () => {
    const { db, log } = fakeDb([{ id: 'r1', ...key }])
    await expect(applyChange(db, 'exam_schedules', null, { registration_end: '2027-01-24' }, key)).rejects.toBeInstanceOf(RowExistsError)
    expect(log).toEqual([])
  })

  it('still inserts a row that does not exist yet', async () => {
    const { db, log } = fakeDb([{ id: 'r1', ...key, session: 'Default' }])
    expect(await applyChange(db, 'exam_schedules', null, { registration_end: '2027-01-24' }, key, { onExisting: 'update' })).toBe('new')
    expect(log).toEqual(['insert'])
  })
})
