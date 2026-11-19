import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { chatJson } from '@/lib/automation/engine/llm'
import { PREFERENCES } from '@/lib/career-preferences'

/**
 * AI career advisor for the Get Advice results. The formula in /api/recommendations
 * scores careers from marks x interest; this asks the AI to turn those scores plus the
 * student's preferences into personal advice. The AI only sees facts from our own
 * database, and only chooses among the careers the formula already found.
 */


export const AdviceInput = z.object({
  stream: z.string().max(20),
  subjects: z.array(z.object({
    name: z.string().min(1).max(40),
    score: z.number().min(0).max(100),
    interest: z.number().int().min(1).max(5),
  })).min(1).max(20),
  preferences: z.object({
    goal: z.enum(PREFERENCES.goal).optional(),
    workStyle: z.enum(PREFERENCES.workStyle).optional(),
    sector: z.enum(PREFERENCES.sector).optional(),
    budget: z.enum(PREFERENCES.budget).optional(),
  }).default({}),
  careers: z.array(z.object({ slug: z.string().max(80), match_score: z.number().min(0).max(100) })).min(1).max(10),
})

const Output = z.object({
  summary: z.string().min(10).max(700),
  ranking: z.array(z.object({
    slug: z.string(),
    fit: z.enum(['excellent', 'good', 'possible']),
    why: z.string().min(10).max(500),
    consider: z.string().max(300).nullish(),
    next_steps: z.array(z.string().max(200)).max(4).default([]),
  })).min(1),
})

const INTEREST = ['not at all', 'a little', 'okay', 'likes it', 'loves it']

const SYSTEM = `You are a careful career counsellor for Indian students in Class 11-12.
You get a student's marks, how much they enjoy each subject, their preferences, and a short list of careers
our formula matched to them, each with facts from our database.
Rules:
- Use ONLY the facts given under CAREERS. Never invent salaries, exams, colleges, cutoffs, eligibility or any number.
- Only use career slugs from the list. Rank ALL of them, best fit for this student first.
- Rank by the match score first, then adjust for the student's preferences (goal, work style, government or
  private, budget) and the career's facts (competition, growth, work-life balance, official route).
- "why": 1-2 short sentences to the student ("you"), naming their actual subjects and marks and how they connect.
- "consider": one honest point to think about (competition, long study, cost, physical standards...) or null.
- "next_steps": up to 3 concrete steps using only the exams and routes listed for that career.
- "fit": excellent, good or possible.
- "summary": 2-3 sentences on the overall pattern you see in the student's choices.
- Simple English. Encouraging but honest.
Reply with JSON: {"summary": "...", "ranking": [{"slug": "...", "fit": "good", "why": "...", "consider": "..." | null, "next_steps": ["..."]}]}`

type ExamLink = { importance: string | number | null; exams: { name: string; slug: string } | null }
type SkillLink = { importance: string | number | null; skills: { name: string } | null }
type CareerRow = {
  slug: string; title: string; category: string | null; description: string | null
  avg_salary_min: number | null; avg_salary_max: number | null
  growth_level: string | null; competition_level: string | null; work_life_balance: number | null
  official_body: string | null; licence: string | null; official_pay: string | null
  eligibility: { text?: string }[] | null; how_to_enter: { text?: string }[] | null
  career_exams: ExamLink[] | null; career_skills: SkillLink[] | null
}

const lakh = (n: number | null) => (n ? `Rs ${(n / 100000).toFixed(1).replace(/\.0$/, '')} lakh` : '?')
const texts = (list: { text?: string }[] | null, n: number) => (Array.isArray(list) ? list.map((x) => x?.text).filter(Boolean).slice(0, n) as string[] : [])


export type AdviceInput = z.infer<typeof AdviceInput>
export type CareerAdvice = {
  summary: string
  ranking: { slug: string; fit: 'excellent' | 'good' | 'possible'; why: string; consider: string | null; next_steps: string[]; exams: { name: string; slug: string }[] }[]
}

/** Personal advice for the careers the formula matched; null when no AI model could answer. */
export async function adviseCareers(supabase: SupabaseClient, input: AdviceInput): Promise<CareerAdvice | null | 'no-careers'> {
  const { stream, subjects, preferences, careers } = input
  const { data, error } = await supabase
    .from('careers')
    .select(`slug, title, category, description, avg_salary_min, avg_salary_max, growth_level, competition_level,
      work_life_balance, official_body, licence, official_pay, eligibility, how_to_enter,
      career_exams(importance, exams(name, slug)), career_skills(importance, skills(name))`)
    .in('slug', careers.map((c) => c.slug))
  if (error) throw error
  const rows = new Map(((data ?? []) as unknown as CareerRow[]).map((r) => [r.slug, r]))
  const known = careers.filter((c) => rows.has(c.slug))
  if (!known.length) return 'no-careers'

  // Exams per career come from our database, never from the AI
  const examsOf = (r: CareerRow) => (r.career_exams ?? []).map((l) => l.exams).filter((e): e is { name: string; slug: string } => !!e).slice(0, 4)

  const careerText = known.map((c) => {
    const r = rows.get(c.slug)!
    const lines = [
      `- slug: ${r.slug} | ${r.title} (${r.category ?? 'career'}) | match score ${c.match_score}%`,
      `  about: ${(r.description ?? '').slice(0, 220)}`,
      `  typical salary: ${lakh(r.avg_salary_min)} to ${lakh(r.avg_salary_max)} a year; growth ${r.growth_level ?? '?'}; competition ${r.competition_level ?? '?'}; work-life balance ${r.work_life_balance ?? '?'}/10`,
    ]
    const exams = examsOf(r).map((e) => e.name)
    if (exams.length) lines.push(`  entrance / recruitment exams: ${exams.join(', ')}`)
    const skills = (r.career_skills ?? []).map((s) => s.skills?.name).filter(Boolean).slice(0, 5)
    if (skills.length) lines.push(`  key skills: ${skills.join(', ')}`)
    if (r.official_body) lines.push(`  official body: ${r.official_body}${r.licence ? `; licence: ${r.licence}` : ''}`)
    const elig = texts(r.eligibility, 2)
    if (elig.length) lines.push(`  official eligibility: ${elig.join(' / ').slice(0, 300)}`)
    const route = texts(r.how_to_enter, 2)
    if (route.length) lines.push(`  official route in: ${route.join(' / ').slice(0, 300)}`)
    if (r.official_pay) lines.push(`  official pay: ${r.official_pay.slice(0, 150)}`)
    return lines.join('\n')
  }).join('\n')

  const prefs = Object.entries(preferences).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ') || 'not given'
  const student = [
    `Stream: ${stream}`,
    `Subjects: ${subjects.map((s) => `${s.name} ${s.score}/100 (${INTEREST[s.interest - 1]})`).join(', ')}`,
    `Preferences: ${prefs}`,
  ].join('\n')

  // Every career must come back ranked and explained; a model that skips some is asked no further
  const schema = Output.extend({ ranking: Output.shape.ranking.min(known.length) })
  const ai = await chatJson(SYSTEM,
    `STUDENT\n${student}\n\nCAREERS (${known.length}; return all ${known.length} in "ranking")\n${careerText}`,
    schema, { temperature: 0.3, interactive: true })
  if (!ai) return null

  // Keep only careers we sent, once each; any the AI skipped follow in score order
  const seen = new Set<string>()
  const ranking: CareerAdvice['ranking'] = ai.ranking.filter((r) => rows.has(r.slug) && known.some((c) => c.slug === r.slug) && !seen.has(r.slug) && seen.add(r.slug))
    .map((r) => ({ ...r, consider: r.consider || null, next_steps: r.next_steps.slice(0, 3), exams: examsOf(rows.get(r.slug)!) }))
  for (const c of known) {
    if (!seen.has(c.slug)) ranking.push({ slug: c.slug, fit: 'possible', why: '', consider: null, next_steps: [], exams: examsOf(rows.get(c.slug)!) })
  }

  return { summary: ai.summary, ranking }
}
