import type { SupabaseClient } from '@supabase/supabase-js'

/** A detail the official website does not publish: an estimate, a third-party figure, or a discontinued note. */
export type Estimate = {
  field: string
  kind: 'estimate' | 'secondary' | 'discontinued'
  value_text: string
  value_min: number | null
  value_max: number | null
  unit: string | null
  basis: string | null
  source_name: string | null
  source_url: string | null
  updated_at: string
}

export type EstimateEntity = 'exam' | 'college' | 'career' | 'scholarship'

/** All estimates for one record, by field. Empty when the table is missing or unreadable. */
export async function getEstimates(db: SupabaseClient, entity: EstimateEntity, recordId: string): Promise<Record<string, Estimate>> {
  const { data, error } = await db
    .from('data_estimates')
    .select('field, kind, value_text, value_min, value_max, unit, basis, source_name, source_url, updated_at')
    .eq('entity', entity)
    .eq('record_id', recordId)
  if (error || !data) return {}
  return Object.fromEntries((data as Estimate[]).map((e) => [e.field, e]))
}
