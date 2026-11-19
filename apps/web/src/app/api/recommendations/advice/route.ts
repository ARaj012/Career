import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { AiQuotaError } from '@/lib/automation/engine/llm'
import { AdviceInput, adviseCareers } from '@/lib/career-advice'

/** AI advice on top of the formula's career matches (see lib/career-advice.ts). */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const limit = rateLimit('career-advice', user.id, 6, 60_000)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })
    }

    const parsed = AdviceInput.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const advice = await adviseCareers(supabase, parsed.data)
    if (advice === 'no-careers') return NextResponse.json({ error: 'No careers to advise on' }, { status: 400 })
    if (!advice) return NextResponse.json({ error: 'The AI advisor is busy right now. Your match scores are still shown.' }, { status: 503 })
    return NextResponse.json(advice)
  } catch (error) {
    if (error instanceof AiQuotaError) {
      return NextResponse.json({ error: 'The AI advisor has reached its daily limit. Your match scores are still shown.' }, { status: 503 })
    }
    console.error('Career advice error:', error)
    return NextResponse.json({ error: 'Could not get AI advice right now.' }, { status: 500 })
  }
}
