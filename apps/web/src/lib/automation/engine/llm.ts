/**
 * Reads official page text and returns structured JSON.
 * Uses the GROQ_API_KEY the project already has for the chat widget.
 *
 * The model is a *reader*, not a source: every value must carry a verbatim
 * quote, and evidence.ts throws away anything the page does not support.
 */
import Groq from 'groq-sdk'
import type { z } from 'zod'

// Read per call, not at import: the CLI loads .env.local after its imports run.
// Each Groq model has its own free daily limit, so when one runs out the reader moves to
// the next (AUTOMATION_MODELS, comma-separated; AUTOMATION_MODEL picks the first).
const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']
function models(): string[] {
  const list = (process.env.AUTOMATION_MODELS || DEFAULT_MODELS.join(',')).split(',').map((m) => m.trim()).filter(Boolean)
  const first = process.env.AUTOMATION_MODEL?.trim()
  return first ? [first, ...list.filter((m) => m !== first)] : list
}
// Models that hit their daily limit (or are not available) in this server process, with when
const exhausted = new Map<string, number>()
const DAY = 24 * 3600_000
function model(): string | null {
  for (const [m, at] of exhausted) if (Date.now() - at > DAY / 2) exhausted.delete(m)
  return models().find((m) => !exhausted.has(m)) ?? null
}
let client: Groq | null = null

function groq(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Automation needs it to read official pages.')
  }
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY })
  return client
}

export const READER_RULES = `You read text copied from an OFFICIAL website and report facts that are written in it.
Rules:
- Use ONLY what the text states. Never use outside knowledge, never estimate, never fill gaps.
- For every value include "quote": a short passage copied CHARACTER-FOR-CHARACTER from the text (8-200 chars) that contains the value. Do not paraphrase, translate or fix typos in quotes.
- If a value is not explicitly stated, return null for it. Returning null is always better than guessing.
- Dates must be ISO YYYY-MM-DD. If the text gives a date without a year, use the year implied by the same table/heading; if unclear, null.
- Respond with JSON only.`

/** Daily AI quota is used up; retrying won't help until it resets, so the run should stop. */
export class AiQuotaError extends Error {}

export async function extractJson<T>(task: string, pageText: string, schema: z.ZodType<T>): Promise<T | null> {
  const messages = [
    { role: 'system' as const, content: READER_RULES },
    { role: 'user' as const, content: `${task}\n\n----- PAGE TEXT START -----\n${pageText}\n----- PAGE TEXT END -----` },
  ]

  for (let attempt = 0; attempt < 4; attempt++) {
    const current = model()
    if (!current) throw new AiQuotaError(`Daily Groq AI limit reached on every model (${models().join(', ')}). Click "Update everything" again after it resets; the run resumes where it stopped.`)
    try {
      const res = await groq().chat.completions.create({
        model: current,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages,
      })
      const raw = res.choices[0]?.message?.content ?? ''
      const parsed = schema.safeParse(JSON.parse(raw))
      if (parsed.success) return parsed.data
      console.warn('  ⚠️ AI output did not match schema:', parsed.error.issues.slice(0, 3))
      return null
    } catch (caught) {
      const err = caught as { status?: number; headers?: Record<string, string>; message?: string }
      const status = err?.status ?? 0
      if (status === 429 || status >= 500) {
        const retryAfter = Number(err?.headers?.['retry-after'] ?? 0)
        if (status === 429 && (retryAfter > 120 || /per day|TPD|RPD/i.test(err?.message ?? ''))) {
          // This model is done for the day: carry on with the next one
          exhausted.set(current, Date.now())
          console.log(`  🔁 Daily limit reached on ${current}; switching to ${model() ?? 'none left'}`)
          attempt--
          continue
        }
        const wait = Math.max(retryAfter * 1000, 5000 * (attempt + 1))
        console.log(`  ⏳ AI rate-limited, waiting ${Math.round(wait / 1000)}s`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      // A model Groq no longer offers (404 / model_not_found): skip it
      if (status === 404 || /model.*(not found|decommission|does not exist)/i.test(err?.message ?? '')) {
        exhausted.set(current, Date.now())
        console.log(`  🔁 ${current} is not available; switching to ${model() ?? 'none left'}`)
        attempt--
        continue
      }
      if (caught instanceof SyntaxError) {
        console.warn('  ⚠️ AI returned invalid JSON')
        return null
      }
      throw caught
    }
  }
  return null
}
