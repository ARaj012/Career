/* eslint-disable @typescript-eslint/no-explicit-any */
// File location: apps/web/src/app/exams/[slug]/roadmap/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ExamRoadmap from '@/components/exams/ExamRoadmap'
import ExamPattern from '@/components/exams/ExamPattern'
import OfficialSyllabus from '@/components/exams/OfficialSyllabus'

export default async function ExamRoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, name, slug, exam_level, conducting_body, syllabus_source_url, syllabus_verified_at, syllabus_changes')
    .eq('slug', slug)
    .maybeSingle()

  if (examError) {
    console.error('Failed to load exam for roadmap:', {
      message: examError.message,
      details: examError.details,
      hint: examError.hint,
      code: examError.code,
    })
    throw new Error(`Failed to load exam "${slug}": ${examError.message}`)
  }

  if (!exam) {
    notFound()
  }

  const { data: allSyllabus } = await supabase
    .from('exam_syllabus')
    .select('subject, topic, weightage, stage, source_type, sort_order, added_at')
    .eq('exam_id', (exam as any).id)
  // Official units (read from the conducting body) vs the older focus-area estimates
  const officialRows = (allSyllabus ?? []).filter((r: any) => r.source_type === 'official')
  const syllabusRows = (allSyllabus ?? []).filter((r: any) => r.source_type !== 'official')

  // Multi-stage exams (UPSC-style: Prelims / Mains / Interview) have more
  // than one exam_pattern row for the same exam_id, ordered by stage_order.
  const { data: patternRows } = await supabase
    .from('exam_pattern')
    .select('*')
    .eq('exam_id', (exam as any).id)
    .order('stage_order', { ascending: true })

  const hasSyllabus = syllabusRows && syllabusRows.length > 0
  const hasPattern = patternRows && patternRows.length > 0

  // exam_syllabus has no stage_order column of its own and Postgres doesn't
  // guarantee row order without an ORDER BY, so derive the correct stage
  // sequence from patternRows (which IS reliably ordered) and hand it to
  // ExamRoadmap — otherwise its tabs could occasionally show "Mains" before
  // "Prelims" even though ExamPattern gets it right.
  const stageOrder = (patternRows ?? [])
    .map((p: any) => p.stage)
    .filter((s: string | null): s is string => !!s)

  // A roadmap page is worth showing if we have either syllabus weightage
  // data or exam-pattern data.
  const hasOfficial = officialRows.length > 0 || !!(exam as any).syllabus_source_url
  if (!hasSyllabus && !hasPattern && !hasOfficial) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <Link href={`/exams/${slug}`} className="text-indigo-200 hover:text-white text-sm">
            ← Back to {(exam as any).name}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{(exam as any).name} — Study Roadmap</h1>
          <p className="text-indigo-100 mt-3 text-lg max-w-2xl">
            Exam pattern, the official syllabus with what changed this year, and the topics that have carried the
            most marks in past papers.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {(exam as any).exam_level && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                🌐 {(exam as any).exam_level}
              </span>
            )}
            {(exam as any).conducting_body && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                🏛️ {(exam as any).conducting_body}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {hasPattern && <ExamPattern patterns={patternRows as any} examName={(exam as any).name} />}

        {hasOfficial && (
          <OfficialSyllabus
            rows={officialRows as any}
            sourceUrl={(exam as any).syllabus_source_url}
            verifiedAt={(exam as any).syllabus_verified_at}
            changes={(exam as any).syllabus_changes}
          />
        )}

        {hasSyllabus && (
          <ExamRoadmap
            syllabusRows={syllabusRows as any}
            examName={(exam as any).name}
            stageOrder={stageOrder}
          />
        )}

        <Link
          href={`/exams/${slug}`}
          className="inline-block mt-4 text-indigo-600 hover:underline text-sm"
        >
          ← Back to full {(exam as any).name} details (dates, cutoffs, eligibility, toppers)
        </Link>
      </div>
    </div>
  )
}
