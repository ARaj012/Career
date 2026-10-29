/**
 * Official exam syllabus: the units/chapters the conducting body publishes
 * in its syllabus page or information bulletin. Every unit must be quoted
 * from an official page. When a later syllabus adds or drops units, the
 * change is recorded on the exam (syllabus_changes) and shown to students.
 *
 * The older hand-typed "focus areas" with estimated weightage are not
 * touched: they stay labelled unverified, because no official body publishes
 * topic-wise weightage for most exams.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { normalize } from './evidence'
import { fetchPage, relevantLinks } from './http'
import { gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { examNamePattern, type ExamRow } from './exams'

const SYLLABUS = /(syllabus|curriculum|information bulletin|prospectus|scheme of exam)/i
const UNIT_WORD = /\b(unit|chapter|module|section|paper|part|topic)\b/gi

const Output = z.object({
  edition: z.object({ value: z.string().nullish(), quote: z.string().nullish() }).nullish(),
  topics: z
    .array(
      z.object({
        stage: z.string().nullish(),
        subject: z.string(),
        topic: z.string(),
        quote: z.string().nullish(),
      })
    )
    .default([]),
})

export type SyllabusExam = ExamRow & { syllabus_source_url?: string | null; syllabus_read_at?: string | null }

export type SyllabusResult = { slug: string; outcomes: never[]; skipped?: string; errors: string[]; dropped: string[]; log: string[] }

const key = (stage: string | null, subject: string, topic: string) => `${normalize(stage ?? '')}|${normalize(subject)}|${normalize(topic)}`

/** Most of the topic's words (3+ letters) must be in its quote. */
export function quoteNamesTopic(topic: string, quote: string): boolean {
  const q = ` ${normalize(quote)} `
  const words = normalize(topic).split(' ').filter((w) => w.length >= 3)
  if (!words.length) return false
  return words.filter((w) => q.includes(` ${w}`)).length / words.length >= 0.8
}

/**
 * The part of a long bulletin that holds the syllabus: of all the places
 * "syllabus" appears, the one followed by the most unit/chapter headings.
 */
export function syllabusSection(text: string, size: number): string {
  if (text.length <= size) return text
  let best = 0
  let bestScore = -1
  for (const m of text.matchAll(/syllabus/gi)) {
    const score = (text.slice(m.index!, m.index! + size).match(UNIT_WORD) ?? []).length
    if (score > bestScore) { best = m.index!; bestScore = score }
  }
  const from = Math.max(0, best - Math.min(200, size / 4))
  return text.slice(from, from + size)
}

/** Official pages with the syllabus: the exam's own pages, their syllabus links, and one hop further. */
async function syllabusPages(db: SupabaseClient, exam: SyllabusExam, ownUrls: string[]) {
  const focus = examNamePattern(exam.name)
  // A syllabus link saved earlier (or pasted by an admin) goes first: some
  // bodies block automated readers on their exam portals but not on the PDF host
  const start = [exam.syllabus_source_url, ...ownUrls].filter(Boolean) as string[]
  const gathered = await gatherPages(db, start, 4, SYLLABUS, focus)
  const seen = new Set(gathered.pages.map((p) => p.url))
  // The exam's current site (e.g. this year's GATE organiser) or its "Syllabus"
  // page usually links the PDF that holds the actual units
  for (const p of gathered.pages.filter((p) => p.kind === 'html')) {
    const named = new Set(p.links.filter((l) => SYLLABUS.test(`${l.text} ${l.url}`)).map((l) => l.url))
    for (const url of relevantLinks(p, 6, SYLLABUS, focus).filter((u) => named.has(u)).slice(0, 2)) {
      if (seen.has(url) || gathered.pages.length >= 10) continue
      seen.add(url)
      try { gathered.pages.push(await fetchPage(url)) } catch (err) { gathered.errors.push((err as Error).message) }
    }
  }
  // A page counts only if it holds a syllabus, not just a "Syllabus" menu link
  const pages = gathered.pages.filter(
    (p) => isOfficialUrl(p.finalUrl, [...start, ...ownUrls]) && /syllabus/i.test(p.text) && (syllabusSection(p.text, 8000).match(UNIT_WORD) ?? []).length >= 8
  )
  // Where the syllabus is split into many documents (GATE: one PDF per paper), keep the page that lists them
  const listing = gathered.pages.find((p) => p.kind === 'html' && /syllab/i.test(p.finalUrl) && isOfficialUrl(p.finalUrl, ownUrls))
  return { pages, listing, all: gathered.pages, changed: gathered.changed, errors: gathered.errors }
}

export async function updateSyllabus(
  db: SupabaseClient,
  exam: SyllabusExam,
  opts: { dryRun: boolean; force: boolean; today?: Date }
): Promise<SyllabusResult> {
  const today = opts.today ?? new Date()
  const res: SyllabusResult = { slug: exam.slug, outcomes: [], errors: [], dropped: [], log: [] }
  const ownUrls = [exam.official_url, ...(exam.source_urls ?? [])].filter(Boolean) as string[]
  if (!ownUrls.length) return { ...res, skipped: 'no official_url' }

  const found = await syllabusPages(db, exam, ownUrls)
  res.errors.push(...found.errors)
  if (!found.pages.length) {
    // Students still get the official syllabus link even when its units cannot be read here
    if (found.listing && !opts.dryRun) await db.from('exams').update({ syllabus_source_url: found.listing.finalUrl, syllabus_checked_at: today.toISOString() }).eq('id', exam.id)
    return { ...res, skipped: found.listing ? `syllabus is split across documents; linked ${found.listing.finalUrl}` : 'no official syllabus found on the official site' }
  }
  // The exam-date check caches the same pages, so "unchanged" only counts once this reader has read them
  if (!found.changed && exam.syllabus_read_at && !opts.force) return { ...res, skipped: 'official pages unchanged since last run' }

  // Only the newest edition (NTA keeps last year's syllabus notice up too), PDFs first
  const editionOf = (p: { finalUrl: string; text: string }) => Math.max(0, ...[...`${p.finalUrl} ${p.text.slice(0, 800)}`.matchAll(/\b(20\d\d)\b/g)].map((m) => Number(m[1])).filter((y) => y <= today.getFullYear() + 1))
  const newest = Math.max(...found.pages.map(editionOf))
  const pages = found.pages
    .filter((p) => editionOf(p) === newest)
    .sort((a, b) => Number(b.kind === 'pdf') - Number(a.kind === 'pdf'))
    .slice(0, 2)
  const per = Math.floor(14_000 / pages.length)
  const context = pages.map((p, i) => `### SOURCE ${i + 1}: ${p.finalUrl}\n${syllabusSection(p.text, per)}`).join('\n\n')

  const { data: patternRows } = await db.from('exam_pattern').select('stage').eq('exam_id', exam.id)
  const stages = [...new Set((patternRows ?? []).map((r) => r.stage).filter(Boolean))] as string[]
  const Y = today.getFullYear()

  const task = `Exam: "${exam.name}". Today is ${today.toISOString().slice(0, 10)}.
List the OFFICIAL SYLLABUS of this exam as written in the text: for each subject (or paper), every unit / chapter heading, in the order given.
- topic = the unit or chapter title exactly as the text writes it, without its number (e.g. "UNIT 3: LAWS OF MOTION" → "Laws of Motion"). Do NOT list every sub-point inside a unit; list the units.
- subject = the subject or paper the unit belongs to (e.g. "Physics", "Paper I: General Studies").
- stage = ${stages.length ? `one of ${stages.map((s) => `"${s}"`).join(', ')} if the text says which stage the syllabus is for, else null` : 'null'}.
- quote = the line of text that contains the unit title, copied exactly.
- edition = the year/session the syllabus is for, with a quote, e.g. {"value":"${Y + 1}","quote":"Syllabus for JEE (Main) ${Y + 1}"}; null if not stated.
Ignore syllabi of other exams on the page. If the text holds no syllabus for this exam, return {"edition":null,"topics":[]}.
JSON: {"edition":{"value":"…","quote":"…"},"topics":[{"stage":null,"subject":"…","topic":"…","quote":"…"}]}`

  if (process.env.AUTOMATION_DEBUG) console.log(`    📄 ${pages.map((p) => `${p.finalUrl} (${p.text.length})`).join(', ')}
${context.slice(0, 1500)}`)
  const ai = await extractJson(task, context, Output)
  // Cached only after a successful read, so a failed read is retried next time
  if (!ai) return { ...res, skipped: 'AI could not read the syllabus' }
  if (!opts.dryRun) {
    await saveCache(db, found.all)
    await db.from('exams').update({ syllabus_read_at: today.toISOString() }).eq('id', exam.id)
  }

  const normCache = new Map<string, string>()
  const verified: { stage: string | null; subject: string; topic: string; url: string }[] = []
  const seenKeys = new Set<string>()
  for (const t of ai.topics) {
    const url = locateQuote(t.quote, pages, normCache)
    if (!url) { res.dropped.push(`${exam.slug} · ${t.subject} · ${t.topic}: quote not on the syllabus page`); continue }
    if (!quoteNamesTopic(t.topic, t.quote!)) { res.dropped.push(`${exam.slug} · ${t.topic}: quote does not name the unit`); continue }
    const stage = t.stage ? stages.find((s) => normalize(s) === normalize(t.stage!)) ?? null : null
    const subject = t.subject.trim().slice(0, 120)
    const topic = t.topic.trim().replace(/^(unit|chapter|module)\s*[-–:]?\s*[\divx]+\s*[:.\-–]?\s*/i, '').slice(0, 300)
    const k = key(stage, subject, topic)
    if (seenKeys.has(k)) continue
    seenKeys.add(k)
    verified.push({ stage, subject, topic, url })
  }
  // A partial read must not pass for the whole syllabus
  if (verified.length < 5 || verified.length < ai.topics.length * 0.7) {
    return { ...res, skipped: `only ${verified.length} of ${ai.topics.length} units confirmed on the official page` }
  }

  const sourceUrl = verified[0].url
  const editionYear = ai.edition?.value && ai.edition.quote && locateQuote(ai.edition.quote, pages, normCache)
    ? Number(/20\d\d/.exec(ai.edition.value)?.[0]) || null
    : null

  const { data: old } = await db.from('exam_syllabus').select('id, stage, subject, topic').eq('exam_id', exam.id).eq('source_type', 'official')
  const previous = new Map((old ?? []).map((r) => [key(r.stage, r.subject, r.topic ?? ''), r]))
  const next = new Set(verified.map((v) => key(v.stage, v.subject, v.topic)))
  const added = verified.filter((v) => !previous.has(key(v.stage, v.subject, v.topic)))
  // Units that vanished are removed only when the new read is about as complete as the old one
  const complete = verified.length >= previous.size * 0.8
  const removed = complete ? [...previous.entries()].filter(([k]) => !next.has(k)).map(([, r]) => r) : []
  if (!complete && previous.size) res.log.push(`${exam.slug}: new read has ${verified.length} units vs ${previous.size} before; kept the old ones`)

  if (opts.dryRun) {
    res.log.push(`${exam.slug}: ${verified.length} official units (${added.length} new, ${removed.length} removed) [dry run]`)
    return res
  }

  const now = today.toISOString()
  const firstRead = previous.size === 0
  if (added.length) {
    const { error } = await db.from('exam_syllabus').insert(
      added.map((v) => ({
        exam_id: exam.id, stage: v.stage, subject: v.subject, topic: v.topic, weightage: null,
        source_type: 'official', source_url: v.url, verified_at: now, added_at: firstRead ? null : now,
      }))
    )
    if (error) { res.errors.push(`syllabus insert: ${error.message}`); return res }
  }
  if (removed.length) await db.from('exam_syllabus').delete().in('id', removed.map((r) => r.id))
  // Keep the official order and re-confirm what is still there
  for (const [i, v] of verified.entries()) {
    const row = previous.get(key(v.stage, v.subject, v.topic))
    if (row) await db.from('exam_syllabus').update({ sort_order: i, verified_at: now, source_url: v.url }).eq('id', row.id)
    else await db.from('exam_syllabus').update({ sort_order: i }).eq('exam_id', exam.id).eq('source_type', 'official').eq('subject', v.subject).eq('topic', v.topic)
  }

  const examUpdate: Record<string, unknown> = { syllabus_source_url: sourceUrl, syllabus_verified_at: now }
  if (!firstRead && (added.length || removed.length)) {
    examUpdate.syllabus_changes = {
      date: now.slice(0, 10),
      edition: editionYear,
      added: added.map((v) => ({ subject: v.subject, topic: v.topic })),
      removed: removed.map((r) => ({ subject: r.subject, topic: r.topic })),
      source_url: sourceUrl,
    }
  }
  await db.from('exams').update(examUpdate).eq('id', exam.id)
  res.log.push(
    firstRead
      ? `${exam.slug}: saved ${verified.length} official syllabus units`
      : `${exam.slug}: ${added.length} units added, ${removed.length} removed, ${verified.length - added.length} unchanged`
  )
  return res
}
