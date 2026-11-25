/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Metadata } from 'next'
import TrackExamButton from '@/components/TrackExamButton'
import KeyDates, { type ScheduleRow } from '@/components/exams/KeyDates'
import EstimateNote from '@/components/EstimateNote'
import PreviousPapers, { type PaperRow } from '@/components/exams/PreviousPapers'
import RelatedScholarships, { RELATED_SCHOLARSHIP_COLUMNS, toRelated } from '@/components/scholarships/RelatedScholarships'
import { getEstimates } from '@/lib/estimates'
import { ExamQualifyingCutoffs, ExamCollegeCutoffs, BRANCHES, RANK_CATEGORIES } from '@/components/exams/ExamCutoffs'

const STRATEGY_STEPS = [
  {
    title: 'Understand the Exam Pattern & Syllabus',
    description:
      'Get the official syllabus and past papers first. Knowing the exact topics, weightage, and question format shapes everything else you do.',
  },
  {
    title: 'Build Strong Fundamentals',
    description:
      'Go topic by topic through standard reference material before jumping to shortcuts or tricks — a shaky foundation shows up under exam pressure.',
  },
  {
    title: 'Practice with Timed Mock Tests',
    description:
      'Simulate real exam conditions regularly. Mocks reveal weak areas and build the speed and stamina the actual exam demands.',
  },
  {
    title: 'Review Mistakes & Refine',
    description:
      'After every mock, spend as much time reviewing wrong answers as you did taking the test. This is where most of the real improvement happens.',
  },
  {
    title: 'Final Revision & Exam-Day Strategy',
    description:
      'In the last phase, focus on quick revision, formula sheets, and deciding your question-attempt order and time allocation in advance.',
  },
]

const SCHEDULE_FIELDS =
  'year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, data_status, source_url, verified_at, total_applicants, total_selected'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: exam } = await supabase
    .from('exams')
    .select('name, conducting_body, exam_level, mode, frequency')
    .in('slug', [slug, slug.replace(/_/g, '-')])
    .limit(1)
    .maybeSingle()
  if (!exam) return { title: 'Exam | Snova' }

  const details = [exam.conducting_body, exam.exam_level && `${exam.exam_level} level`, exam.mode && `${exam.mode} mode`, exam.frequency]
    .filter(Boolean)
    .join(', ')
  return {
    title: `${exam.name} - Dates, Syllabus, Cutoff & Preparation | Snova`,
    description: `${exam.name}${details ? `: ${details}` : ''}. Exam dates, eligibility, syllabus, cutoffs and preparation tips.`,
  }
}

export default async function ExamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ branch?: string; cat?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const branch = query.branch && BRANCHES[query.branch] ? query.branch : 'cse'
  const rankCategory = query.cat && RANK_CATEGORIES.includes(query.cat) ? query.cat : 'OPEN'
  const supabase = await createServerSupabaseClient()

  // Try the slug as-is first
  let { data: exam, error: examError } = await supabase
    .from('exams')
    .select(
      `
      *,
      exam_schedules ( ${SCHEDULE_FIELDS} ),
      exam_eligibility ( min_percentage, class_required, stream_required, age_min, age_max, nationality )
    `
    )
    .eq('slug', slug)
    .maybeSingle()

  // If not found, try replacing underscores with hyphens
  if (!exam && slug.includes('_')) {
    const altSlug = slug.replace(/_/g, '-')
    const { data: altExam, error: altError } = await supabase
      .from('exams')
      .select(
        `
        *,
        exam_schedules ( ${SCHEDULE_FIELDS} ),
        exam_eligibility ( min_percentage, class_required, stream_required, age_min, age_max, nationality )
      `
      )
      .eq('slug', altSlug)
      .maybeSingle()
    if (altExam) {
      exam = altExam
      examError = altError
    }
  }

  if (!exam) notFound()
  const examData = exam as any

  if (examError) {
    console.error('Failed to load exam:', {
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

  const schedules = ((exam as any).exam_schedules ?? []) as any[]
  // Selection stats come from the most recent cycle that has them
  const latestSchedule = [...schedules].filter((s) => s.total_applicants).sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? null
  const eligibility = ((exam as any).exam_eligibility ?? [])[0] ?? null

  // Official counselling closing ranks (JoSAA) for one branch and category, last five years
  // (JoSAA covers JEE only; other exams' official college cutoffs are listed below)
  const isJosaa = ['jee-main', 'jee-advanced'].includes(exam.slug)
  const { data: latestOfficial } = isJosaa
    ? await supabase
        .from('college_exam_cutoffs')
        .select('year')
        .eq('exam_id', exam.id)
        .eq('source_type', 'official')
        .order('year', { ascending: false })
        .limit(1)
    : { data: [] as { year: number }[] }
  const latestRankYear = latestOfficial?.[0]?.year as number | undefined
  const { data: rankRows } = latestRankYear
    ? await supabase
        .from('college_exam_cutoffs')
        .select('year, quota, opening_rank, cutoff_rank, colleges ( name, slug, nirf_rank )')
        .eq('exam_id', exam.id)
        .eq('source_type', 'official')
        .eq('program_name', BRANCHES[branch].program)
        .eq('category', rankCategory)
        .in('quota', ['AI', 'OS'])
        .gte('year', latestRankYear - 4)
        .limit(1000)
    : { data: [] }

  // College-wise cutoffs for exams without JoSAA data: official notices first, older unverified figures marked
  const { data: cutoffRows } = latestRankYear
    ? { data: [] }
    : await supabase
        .from('college_exam_cutoffs')
        .select(
          'year, category, cutoff_score, cutoff_rank, program_name, quota, round, source_type, source_url, colleges ( name, slug, city, state, nirf_rank ), college_courses ( course_name, degree_type )'
        )
        .eq('exam_id', exam.id)
        .order('year', { ascending: false })
        .limit(1000)

  const rows = (cutoffRows ?? []) as any[]
  const anyOfficialCollege = rows.some((r) => r.source_type === 'official')
  const anyUnverifiedCollege = rows.some((r) => r.source_type !== 'official')
  const byYear = new Map<number, any[]>()
  for (const row of rows) {
    if (!byYear.has(row.year)) byYear.set(row.year, [])
    byYear.get(row.year)!.push(row)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a)
  for (const y of years) {
    // Official rows first, then by NIRF rank
    byYear.get(y)!.sort((a, b) => Number(b.source_type === 'official') - Number(a.source_type === 'official') || (a.colleges?.nirf_rank ?? 9999) - (b.colleges?.nirf_rank ?? 9999))
  }

  // Careers this exam is relevant for
  const { data: careerLinks } = await supabase
    .from('career_exams')
    .select('importance, careers ( title, slug, demand_score )')
    .eq('exam_id', exam.id)
    .limit(60)
  // Every career the exam leads to (UPSC CSE fills 23 services), required ones and the most sought-after first
  const IMPORTANCE: Record<string, number> = { Mandatory: 0, Preferred: 1, Optional: 2 }
  const relatedCareers = ((careerLinks ?? []) as any[])
    .filter((c) => c.careers)
    .sort((a, b) => (IMPORTANCE[a.importance] ?? 3) - (IMPORTANCE[b.importance] ?? 3) || Number(b.careers.demand_score ?? 0) - Number(a.careers.demand_score ?? 0))
    .map((c) => c.careers)

  // National/service-level cutoffs — for exams that don't gate a specific
  // college admission (NDA, UPSC CSE, CDS, NET exams, etc.)
  const { data: nationalCutoffRows } = await supabase
    .from('exam_national_cutoffs')
    .select('*')
    .eq('exam_id', exam.id)
    .order('year', { ascending: false })
    .limit(2000)

  // Some old rows hold toppers' scores, which are not cutoffs
  const nationalCutoffs = ((nationalCutoffRows ?? []) as any[]).filter((r) => !/topper/i.test(r.notes ?? ''))

  const nationalYearsAsc = [...new Set(nationalCutoffs.map((r) => r.year as number))].sort((a, b) => a - b)

  // Previous-year papers found on the official website (newest first)
  const { data: papersRaw } = await supabase
    .from('exam_papers')
    .select('url, title, kind, year, source_url')
    .eq('exam_id', exam.id)
    .order('year', { ascending: false, nullsFirst: false })
    .order('title')
  const papers = (papersRaw ?? []) as PaperRow[]

  // Scholarships, fellowships and free coaching that come with this exam
  const { data: scholarshipRows } = await supabase
    .from('exam_scholarships')
    .select(RELATED_SCHOLARSHIP_COLUMNS)
    .eq('exam_id', exam.id)
  const scholarships = toRelated(scholarshipRows as any)

  // Toppers — most recent year available, if any have been entered
  const { data: allToppers } = await supabase
    .from('exam_toppers')
    .select('*')
    .eq('exam_id', exam.id)
    .order('year', { ascending: false })
    .order('rank', { ascending: true })
    .limit(50)

  let toppersYear: number | null = null
  let toppers: any[] = []
  if (allToppers && allToppers.length > 0) {
    toppersYear = (allToppers[0] as any).year
    toppers = (allToppers as any[]).filter((t) => t.year === toppersYear)
  }

  // Subject-wise syllabus & weightage now lives on its own page
  // (/exams/[slug]/roadmap) to keep this page from getting bulky — here we
  // only need to know whether that data exists, to decide whether to show
  // the link card below.
  const { count: syllabusCount } = await supabase
    .from('exam_syllabus')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', exam.id)

  // Details the official website does not publish: labelled estimates / discontinued notes
  const est = await getEstimates(supabase, 'exam', exam.id)

  const hasSelectionStats = latestSchedule?.total_applicants && latestSchedule?.total_selected
  const selectionRate = hasSelectionStats
    ? ((latestSchedule.total_selected / latestSchedule.total_applicants) * 100).toFixed(2)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link href="/exams" className="text-indigo-200 hover:text-white text-sm inline-flex items-center gap-1 mb-4">
            ← Back to Exams
          </Link>
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">{exam.name}</h1>
            {exam.description && (
              <p className="text-indigo-100 text-base sm:text-lg md:text-xl max-w-3xl lg:max-w-4xl leading-relaxed">
                {exam.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
            {exam.exam_level && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                🌐 {exam.exam_level}
              </span>
            )}
            {exam.conducting_body && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                🏛️ {exam.conducting_body}
              </span>
            )}
            {exam.frequency && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                📅 {exam.frequency}
              </span>
            )}
            {exam.mode && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                {exam.mode === 'Online' ? '💻' : '📝'} {exam.mode}
              </span>
            )}
            {nationalYearsAsc.length > 0 && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                📊 {nationalYearsAsc[0]}–{nationalYearsAsc[nationalYearsAsc.length - 1]} cutoff data
              </span>
            )}
            {nationalCutoffs.length > 0 && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                📋 {nationalCutoffs.length} cutoff record{nationalCutoffs.length > 1 ? 's' : ''}
              </span>
            )}
            {nationalYearsAsc.length === 0 && years.length > 0 && (
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                📊 {years.length} year{years.length > 1 ? 's' : ''} of cutoff data
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {est.status?.kind === 'discontinued' && (
          <div className="mb-6 sm:mb-8">
            <EstimateNote estimate={est.status} />
          </div>
        )}

        {/* Key dates */}
        <KeyDates schedules={schedules as ScheduleRow[]} officialUrl={exam.official_url} estimate={est.status?.kind === 'discontinued' ? undefined : est.dates} />

        {/* Eligibility */}
        {eligibility && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Eligibility</h2>
            <div className="flex flex-wrap gap-2">
              {eligibility.class_required && (
                <span className="text-xs bg-yellow-50 text-yellow-700 px-2 sm:px-3 py-1 rounded-full">{eligibility.class_required}</span>
              )}
              {eligibility.stream_required && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full">{eligibility.stream_required}</span>
              )}
              {eligibility.min_percentage && (
                <span className="text-xs bg-green-50 text-green-700 px-2 sm:px-3 py-1 rounded-full">Min {eligibility.min_percentage}%</span>
              )}
              {eligibility.age_max && (
                <span className="text-xs bg-red-50 text-red-700 px-2 sm:px-3 py-1 rounded-full">
                  Age: {eligibility.age_min}-{eligibility.age_max}
                </span>
              )}
              {eligibility.nationality && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-full">{eligibility.nationality} nationals</span>
              )}
            </div>
            {eligibility.age_max && (
              <p className="mt-2 text-xs text-gray-500">The upper age limit shown is for unreserved candidates; reserved categories get the relaxation the official notification states.</p>
            )}
          </div>
        )}

        {/* Selection overview */}
        {hasSelectionStats && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🎯 Selection Overview (Latest Cycle)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{latestSchedule.total_applicants.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Total Applicants</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{latestSchedule.total_selected.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Total Selected</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">{selectionRate}%</p>
                <p className="text-xs text-indigo-600 mt-1">Selection Rate</p>
              </div>
            </div>
          </div>
        )}

        {exam.official_url && (
          <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
            <a
              href={exam.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 text-white font-medium px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm sm:text-base"
            >
              Go to Official Site →
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
          <TrackExamButton examId={exam.id} examSlug={exam.slug} />
        </div>

        {/* How to crack this exam — generic evergreen strategy */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">How to Crack This Exam</h2>
          <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">A proven, general preparation strategy — adapt the timeline to how much time you have left</p>
          <div className="relative">
            {STRATEGY_STEPS.map((step, i) => {
              const isLast = i === STRATEGY_STEPS.length - 1
              return (
                <div key={step.title} className="relative flex gap-3 sm:gap-5 pb-6 sm:pb-8">
                  {!isLast && <div className="absolute left-[15px] sm:left-[19px] top-8 sm:top-10 bottom-0 w-0.5 bg-indigo-200" />}
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-white font-semibold shrink-0 bg-indigo-600 text-sm sm:text-base">
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subject-wise syllabus weightage now lives on its own page — link out
            instead of rendering it inline, to keep this page from getting bulky */}
        {syllabusCount != null && syllabusCount > 0 && (
          <div className="mb-8 sm:mb-10">
            <Link
              href={`/exams/${slug}/roadmap`}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Subject-wise Weightage & Study Roadmap</h2>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                  See exactly where the marks come from, subject by subject, and how to sequence your revision for {exam.name}.
                </p>
              </div>
              <span className="text-xl sm:text-2xl shrink-0 transition-transform group-hover:translate-x-1 self-start sm:self-auto">→</span>
            </Link>
          </div>
        )}

        {!syllabusCount && est.syllabus && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Syllabus Overview</h2>
            <EstimateNote estimate={est.syllabus} />
          </div>
        )}

        <div id="papers" className="scroll-mt-20">
          <PreviousPapers papers={papers} examName={exam.name} officialUrl={exam.official_url} />
        </div>

        <div id="scholarships" className="scroll-mt-20">
          <RelatedScholarships
            items={scholarships}
            title={`Scholarships linked to ${exam.name}`}
            subtitle="Money you can get by taking or clearing this exam — open one to see the full rules on the official source"
            className="mb-6 sm:mb-10"
          />
        </div>

        {/* Toppers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            🏆 Toppers {toppersYear ? `(${toppersYear})` : ''}
          </h2>
          {toppers.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-left text-gray-700">
                    <th className="px-2 sm:px-3 py-3 font-semibold">Rank</th>
                    <th className="px-2 sm:px-3 py-3 font-semibold">Name</th>
                    <th className="px-2 sm:px-3 py-3 font-semibold">Score</th>
                    <th className="px-2 sm:px-3 py-3 font-semibold">City</th>
                  </tr>
                </thead>
                <tbody>
                  {toppers.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="px-2 sm:px-3 py-2 text-gray-900">{t.rank ? `#${t.rank}` : '—'}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-900">{t.name}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-600">{t.score ?? '—'}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-600">{t.city ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">
              Topper details haven&apos;t been added yet.{' '}
              {exam.official_url && (
                <a href={exam.official_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Check the official result page →
                </a>
              )}
            </p>
          )}
        </div>

        {nationalCutoffs.length > 0 ? (
          <ExamQualifyingCutoffs rows={nationalCutoffs} examName={exam.name} />
        ) : est.cutoffs ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Expected Cutoffs</h2>
            <EstimateNote estimate={est.cutoffs} />
          </div>
        ) : null}

        {latestRankYear && (
          <ExamCollegeCutoffs rows={(rankRows ?? []) as any} slug={exam.slug} branch={branch} category={rankCategory} examName={exam.name} />
        )}

        {/* College-wise cutoffs for exams without JoSAA data */}
        {years.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">College Cutoff History</h2>
            <p className="text-gray-500 mb-2">Cutoffs for colleges in our database, {years[years.length - 1]}–{years[0]}</p>
            {anyOfficialCollege && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-2">
                Rows marked ✓ are read from the college&apos;s or the counselling body&apos;s official notice; follow the link to see it.
              </p>
            )}
            {anyUnverifiedCollege && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
                Rows marked * are not yet confirmed from an official counselling source; check the college&apos;s own notice before relying on them.
              </p>
            )}
          </>
        )}

        <div className="space-y-8">
          {years.slice(0, 5).map((year) => (
            <div key={year} className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{year}</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-left text-gray-700">
                      <th className="px-3 py-2 font-medium">College</th>
                      <th className="px-3 py-2 font-medium">Course</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Score</th>
                      <th className="px-3 py-2 font-medium">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byYear.get(year)!.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          {row.colleges?.slug ? (
                            <Link href={`/colleges/${row.colleges.slug}`} className="text-indigo-600 hover:underline">
                              {row.colleges?.name}
                            </Link>
                          ) : (
                            row.colleges?.name ?? '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {row.program_name ?? row.college_courses?.course_name ?? '—'}
                          {!row.program_name && row.college_courses?.degree_type ? ` (${row.college_courses.degree_type})` : ''}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {row.category ?? '—'}
                          {row.quota && <span className="block text-xs text-gray-400">{row.quota}</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.cutoff_score ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {row.cutoff_rank ? `#${row.cutoff_rank.toLocaleString('en-IN')}` : '—'}
                          {row.source_type === 'official' ? (
                            row.source_url ? (
                              <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-emerald-600 hover:underline" title="Official notice">✓</a>
                            ) : <span className="ml-1 text-emerald-600" title="Official notice">✓</span>
                          ) : <span className="ml-1 text-amber-600" title="Not yet confirmed from an official notice">*</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {relatedCareers.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Careers That Require This Exam</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCareers.map((c: any) => (
                <Link
                  key={c.slug}
                  href={`/careers/${c.slug}`}
                  className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
