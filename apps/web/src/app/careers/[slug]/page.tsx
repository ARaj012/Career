/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import SaveCareerButton from '@/components/SaveCareerButton'
import OfficialCareerFacts from '@/components/careers/OfficialCareerFacts'
import EstimateNote from '@/components/EstimateNote'
import RelatedScholarships, { RELATED_SCHOLARSHIP_COLUMNS, toRelated, type RelatedScholarship } from '@/components/scholarships/RelatedScholarships'
import { getEstimates, type Estimate } from '@/lib/estimates'
import {
  ArrowLeft, TrendingUp, IndianRupee, Briefcase, BookOpen,
  GraduationCap, Star, CheckCircle2, Building2, Target,
  BarChart3, Lightbulb, ChevronRight, ExternalLink, Flame,
  Scale, Heart, ArrowRight, BadgeCheck, Zap,
} from 'lucide-react'

// ── Config ─────────────────────────────────────────────────────────────────

const GROWTH_COLORS: Record<string, { bg: string; text: string }> = {
  'Very High': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'High':      { bg: 'bg-green-100',   text: 'text-green-700'   },
  'Medium':    { bg: 'bg-yellow-100',  text: 'text-yellow-700'  },
  'Low':       { bg: 'bg-red-100',     text: 'text-red-700'     },
}

const CATEGORY_COLORS: Record<string, string> = {
  Technology:  'bg-blue-100 text-blue-700',
  Medical:     'bg-red-100 text-red-700',
  Engineering: 'bg-orange-100 text-orange-700',
  Finance:     'bg-green-100 text-green-700',
  Law:         'bg-purple-100 text-purple-700',
  Government:  'bg-indigo-100 text-indigo-700',
  Education:   'bg-yellow-100 text-yellow-700',
  Research:    'bg-cyan-100 text-cyan-700',
  Design:      'bg-pink-100 text-pink-700',
  Media:       'bg-rose-100 text-rose-700',
  Management:  'bg-teal-100 text-teal-700',
  Agriculture: 'bg-lime-100 text-lime-700',
  Defence:     'bg-slate-100 text-slate-700',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Salary N/A'
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  if (min && max) return `${fmt(min)} – ${fmt(max)}/yr`
  if (min) return `From ${fmt(min)}/yr`
  return `Up to ${fmt(max!)}/yr`
}

function formatFees(min: number | null, max: number | null): string {
  if (min === 0 && max === 0) return 'Free'
  if (!min && !max) return 'N/A'
  const fmt = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}/yr`
  return fmt(min ?? max ?? 0) + '/yr'
}

type WeightRow = { career_id: string; subject_id: string; weight: number | string }
type SkillRow = { career_id: string; skill_id: string }

/**
 * Careers that need the same school subjects (cosine similarity of subject weights) and the
 * same skills (overlap). Only genuinely close ones are returned; none is a valid answer.
 */
function relatedCareers(id: string, category: string | null, weights: WeightRow[], skills: SkillRow[], careers: any[]) {
  const vec = new Map<string, Map<string, number>>()
  for (const w of weights) {
    if (!vec.has(w.career_id)) vec.set(w.career_id, new Map())
    vec.get(w.career_id)!.set(w.subject_id, Number(w.weight))
  }
  const skillSet = new Map<string, Set<string>>()
  for (const s of skills) {
    if (!skillSet.has(s.career_id)) skillSet.set(s.career_id, new Set())
    skillSet.get(s.career_id)!.add(s.skill_id)
  }
  const norm = (v: Map<string, number>) => Math.sqrt([...v.values()].reduce((a, x) => a + x * x, 0))
  const mine = vec.get(id)
  const mySkills = skillSet.get(id) ?? new Set<string>()
  if (!mine) return []
  return careers
    .filter((c) => c.id !== id && vec.has(c.id))
    .map((c) => {
      const other = vec.get(c.id)!
      let dot = 0
      for (const [k, v] of mine) dot += v * (other.get(k) ?? 0)
      const subjects = dot / (norm(mine) * norm(other) || 1)
      const theirs = skillSet.get(c.id) ?? new Set<string>()
      const shared = [...mySkills].filter((k) => theirs.has(k)).length
      const skillScore = mySkills.size && theirs.size ? shared / Math.min(mySkills.size, theirs.size) : 0
      const score = 0.55 * subjects + 0.35 * skillScore + (c.category === category ? 0.1 : 0)
      return { ...c, score, sameField: c.category === category }
    })
    // A career from another field has to be a strong match to count as related
    .filter((c) => c.score >= (c.sameField ? 0.6 : 0.7))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  
  // Try the slug as-is first
  let { data: career } = await supabase
    .from('careers')
    .select('title, description, category, avg_salary_min, avg_salary_max, growth_level, demand_score')
    .eq('slug', slug)
    .maybeSingle()

  // If not found, try replacing underscores with hyphens
  if (!career && slug.includes('_')) {
    const altSlug = slug.replace(/_/g, '-')
    const { data: altCareer } = await supabase
      .from('careers')
      .select('title, description, category, avg_salary_min, avg_salary_max, growth_level, demand_score')
      .eq('slug', altSlug)
      .maybeSingle()
    if (altCareer) career = altCareer
  }

  if (!career) {
    return {
      title: 'Career Not Found | Snova',
      description: 'The career you are looking for does not exist.',
    }
  }

  const salaryText = formatSalary(career.avg_salary_min, career.avg_salary_max)
  const description = career.description?.slice(0, 160) || `Explore ${career.title} career: ${salaryText}, ${career.growth_level} growth, ${career.demand_score}/100 demand. Skills, colleges, exams, and career roadmap.`

  return {
    title: `${career.title} Career Guide 2026 | Snova`,
    description,
    keywords: `${career.title}, career guidance, ${career.category}, ${salaryText}, ${career.growth_level} growth, career options, Indian students`,
    openGraph: {
      type: 'article',
      locale: 'en_IN',
      url: `/careers/${slug}`,
      title: [`${career.title} Career Guide`, career.avg_salary_min || career.avg_salary_max ? salaryText : null, career.growth_level ? `${career.growth_level} Growth` : null].filter(Boolean).join(' - '),
      description,
      siteName: 'Snova',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${career.title} Career Guide | Snova`,
      description,
    },
    alternates: {
      canonical: `/careers/${slug}`,
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  // Try the slug as-is first
  let { data: careerRaw } = await supabase
    .from('careers')
    .select('id, title, slug, description, category, avg_salary_min, avg_salary_max, salary_currency, growth_level, competition_level, work_life_balance, demand_score, is_trending, created_at, official_body, official_url, eligibility, how_to_enter, licence, official_pay, official_pay_min, facts_source_url, verified_at, path_steps, top_employers, related_college_slugs')
    .eq('slug', slug)
    .maybeSingle()

  // If not found, try replacing underscores with hyphens
  if (!careerRaw && slug.includes('_')) {
    const altSlug = slug.replace(/_/g, '-')
    const { data: altCareerRaw } = await supabase
      .from('careers')
      .select('id, title, slug, description, category, avg_salary_min, avg_salary_max, salary_currency, growth_level, competition_level, work_life_balance, demand_score, is_trending, created_at, official_body, official_url, eligibility, how_to_enter, licence, official_pay, official_pay_min, facts_source_url, verified_at, path_steps, top_employers, related_college_slugs')
      .eq('slug', altSlug)
      .maybeSingle()
    if (altCareerRaw) careerRaw = altCareerRaw
  }

  if (!careerRaw) notFound()
  const career = careerRaw as any
  const est = await getEstimates(supabase, 'career', career.id)

  // Skills
  const { data: skillsRaw } = await supabase
    .from('career_skills')
    .select('skill_id, importance, skills(name, category:type)')
    .eq('career_id', career.id)
    .limit(20)
  const careerSkills: any[] = skillsRaw ?? []

  // Exams
  const { data: examsRaw } = await supabase
    .from('career_exams')
    .select('exam_id, exams(name, slug, exam_type:exam_level, conducting_body)')
    .eq('career_id', career.id)
    .limit(10)
  const careerExams: any[] = examsRaw ?? []

  // Scholarships: for the studies that lead here, then those that come with its entrance exams
  const examIds = careerExams.map((ce) => ce.exam_id)
  const [{ data: directScholarships }, { data: examScholarships }] = await Promise.all([
    supabase.from('career_scholarships').select(RELATED_SCHOLARSHIP_COLUMNS).eq('career_id', career.id).order('sort_order'),
    examIds.length
      ? supabase.from('exam_scholarships').select(`exam_id, ${RELATED_SCHOLARSHIP_COLUMNS}`).in('exam_id', examIds)
      : Promise.resolve({ data: [] as any[] }),
  ])
  const examName = new Map(careerExams.map((ce) => [ce.exam_id as string, ce.exams?.name as string]))
  const scholarships: RelatedScholarship[] = []
  for (const s of [
    ...toRelated(directScholarships as any),
    ...((examScholarships ?? []) as any[]).flatMap((r) => toRelated([r], examName.get(r.exam_id))),
  ]) if (!scholarships.some((x) => x.slug === s.slug)) scholarships.push(s)

  // Colleges: the ones chosen for this career, else those that admit through its entrance exams
  const COLLEGE_FIELDS = 'id, name, slug, type, state, city, nirf_rank, naac_grade, annual_fees_min, annual_fees_max'
  let relatedColleges: any[] = []
  let collegesFromExams = false
  if (career.related_college_slugs?.length) {
    const { data } = await supabase.from('colleges').select(COLLEGE_FIELDS).in('slug', career.related_college_slugs)
      .order('nirf_rank', { ascending: true, nullsFirst: false }).limit(8)
    relatedColleges = data ?? []
  } else if (careerExams.length) {
    const { data } = await supabase.from('colleges')
      .select(`${COLLEGE_FIELDS}, college_exam_cutoffs!inner(exam_id)`)
      .in('college_exam_cutoffs.exam_id', careerExams.map((ce) => ce.exam_id))
      .limit(1, { referencedTable: 'college_exam_cutoffs' })
      .order('nirf_rank', { ascending: true, nullsFirst: false })
      .limit(8)
    relatedColleges = data ?? []
    collegesFromExams = relatedColleges.length > 0
  }

  // Related careers: those that rely on the same school subjects and skills. A career with
  // no close neighbour shows none, rather than unrelated careers from the same category.
  // The API returns at most 1,000 rows per request, so the link tables are read page by page
  const allRows = async <T,>(table: string, columns: string): Promise<T[]> => {
    const rows: T[] = []
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from(table).select(columns).range(from, from + 999)
      rows.push(...((data ?? []) as T[]))
      if (!data || data.length < 1000) return rows
    }
  }
  const [allWeights, allSkills, { data: allCareers }, { data: subjectRows }] = await Promise.all([
    allRows<WeightRow>('career_subject_weights', 'career_id, subject_id, weight'),
    allRows<SkillRow>('career_skills', 'career_id, skill_id'),
    supabase.from('careers').select('id, title, slug, category, avg_salary_min, avg_salary_max, demand_score, growth_level'),
    supabase.from('subjects').select('id, name'),
  ])
  const similarCareers = relatedCareers(career.id, career.category, allWeights ?? [], allSkills ?? [], allCareers ?? [])
  const subjectName = new Map((subjectRows ?? []).map((s) => [s.id, s.name as string]))
  const keySubjects = (allWeights ?? []).filter((w) => w.career_id === career.id)
    .sort((x, y) => Number(y.weight) - Number(x.weight)).slice(0, 2)
    .map((w) => subjectName.get(w.subject_id)).filter(Boolean) as string[]

  // Group skills by category
  const skillGroups = careerSkills.reduce<Record<string, string[]>>((acc, cs) => {
    if (!cs.skills) return acc
    const cat: string = cs.skills.category ?? 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(cs.skills.name as string)
    return acc
  }, {})

  const growthConfig = GROWTH_COLORS[career.growth_level] ?? GROWTH_COLORS['Medium']
  const categoryColor = career.category ? (CATEGORY_COLORS[career.category] ?? 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700'
  const careerSteps: string[] = career.path_steps ?? []
  const topEmployers: string[] = career.top_employers ?? []
  // Careers read from an official body show its own route and pay instead of the general guide
  const generic = !career.official_body

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Careers
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {career.category && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>{career.category}</span>
                )}
                {career.growth_level && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${growthConfig.bg} ${growthConfig.text}`}>
                    {career.growth_level} Growth
                  </span>
                )}
                {career.is_trending && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Trending
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{career.title}</h1>
              {career.description && <p className="text-gray-600 leading-relaxed text-sm">{career.description}</p>}

              {/* Stats: only what is known (careers read from an official body have no salary/demand estimates) */}
              {(() => {
                const stats = [
                  (career.avg_salary_min || career.avg_salary_max) && { icon: <IndianRupee className="w-5 h-5 text-green-500 mx-auto mb-1" />, value: formatSalary(career.avg_salary_min, career.avg_salary_max), label: 'Avg Salary' },
                  career.growth_level && { icon: <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${growthConfig.text}`} />, value: career.growth_level, label: 'Growth' },
                  career.demand_score != null && { icon: <BarChart3 className="w-5 h-5 text-indigo-500 mx-auto mb-1" />, value: `${career.demand_score}/10`, label: 'Demand' },
                  career.competition_level && { icon: <Scale className="w-5 h-5 text-purple-500 mx-auto mb-1" />, value: career.competition_level, label: 'Competition' },
                ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[]
                return stats.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                    {stats.map((s) => (
                      <div key={s.label} className="text-center">
                        {s.icon}
                        <div className="text-sm font-bold text-gray-800">{s.value}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Score Bars */}
              <div className="mt-5 space-y-3">
                {career.demand_score && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Demand Score</span>
                      <span className="font-semibold text-indigo-600">{career.demand_score}/10</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(career.demand_score / 10) * 100}%` }} />
                    </div>
                  </div>
                )}
                {career.work_life_balance && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> Work-Life Balance</span>
                      <span className="font-semibold text-pink-600">{career.work_life_balance}/5</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-pink-400 h-2 rounded-full" style={{ width: `${(career.work_life_balance / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/recommend" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                  <Target className="w-4 h-4" /> Get Recommendations
                </Link>
                <Link href={`/roadmaps/${career.slug}`} className="inline-flex items-center gap-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                  <Lightbulb className="w-4 h-4" /> View Roadmap
                </Link>
                <SaveCareerButton careerId={career.id} />
              </div>
            </div>

            <OfficialCareerFacts
              title={career.title}
              officialBody={career.official_body}
              officialUrl={career.official_url}
              eligibility={career.eligibility}
              howToEnter={career.how_to_enter}
              licence={career.licence}
              officialPay={career.official_pay}
              sourceUrl={career.facts_source_url}
              verifiedAt={career.verified_at}
            />

            {/* What the official bodies do not publish here: labelled estimates */}
            {(() => {
              const noFacts = !(career.eligibility?.length || career.how_to_enter?.length)
              const notes = [
                noFacts && est.eligibility && { e: est.eligibility, t: 'Typical eligibility' },
                noFacts && !careerSteps.length && est.how_to_enter && { e: est.how_to_enter, t: 'Usual route into this career' },
                !(career.avg_salary_min || career.avg_salary_max) && est.salary && { e: est.salary, t: 'Expected salary in India' },
              ].filter(Boolean) as { e: Estimate; t: string }[]
              return notes.length ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">How to Get In &amp; What It Pays</h2>
                  {notes.map(({ e, t }) => <EstimateNote key={t} estimate={e} title={t} />)}
                </div>
              ) : null
            })()}

            {/* Career Path Steps, written for this career (the official route, when known, is shown above) */}
            {careerSteps.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-green-500" />
                How to Become a {career.title}
              </h2>
              <div className="space-y-3">
                {careerSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 font-medium pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Skills */}
            {careerSkills.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  Skills Required
                  <span className="text-sm font-normal text-gray-400">({careerSkills.length})</span>
                </h2>
                {Object.keys(skillGroups).length > 1 ? (
                  <div className="space-y-4">
                    {Object.entries(skillGroups).map(([cat, skills]) => (
                      <div key={cat}>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg font-medium border border-indigo-100">{skill}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {careerSkills.map((cs, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg font-medium border border-indigo-100">
                        {cs.skills?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Where they work */}
            {topEmployers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Where They Work
              </h2>
              <div className="flex flex-wrap gap-2">
                {topEmployers.map((employer, i) => (
                  <span key={i} className="px-3 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-200 font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                    {employer}
                  </span>
                ))}
              </div>
            </div>
            )}

            {/* Entrance Exams */}
            {careerExams.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  Entrance Exams
                  <span className="text-sm font-normal text-gray-400">({careerExams.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careerExams.map((ce) => (
                    ce.exams && (
                      <Link key={ce.exam_id} href={`/exams/${ce.exams.slug}`}>
                        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors group border border-transparent hover:border-orange-200">
                          <div>
                            <p className="text-sm font-medium text-gray-800 group-hover:text-orange-700">{ce.exams.name}</p>
                            {ce.exams.conducting_body && <p className="text-xs text-gray-400 mt-0.5">{ce.exams.conducting_body}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {ce.exams.exam_type && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{ce.exams.exam_type}</span>}
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                          </div>
                        </div>
                      </Link>
                    )
                  ))}
                </div>
                <Link href="/exams" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all exams →</Link>
              </div>
            )}

            {careerExams.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" /> Entrance Exams
                </h2>
                <p className="text-sm text-gray-600">
                  Entry to this career is not through one of the entrance exams listed on our site.
                  {careerSteps.length || career.how_to_enter?.length || est.how_to_enter
                    ? ' The steps on this page explain how selection works.'
                    : ' Selection is done by the training institutes and employers themselves.'}
                </p>
              </div>
            )}

            {/* Colleges for this career */}
            {relatedColleges.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  {collegesFromExams ? 'Colleges That Admit Through These Exams' : `Where to Study`}
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  {collegesFromExams ? 'Top-ranked colleges in our database that take students through the entrance exams above' : 'Institutions that train students for this career'}
                </p>
                <div className="space-y-3">
                  {relatedColleges.map((college) => (
                    <Link key={college.id} href={`/colleges/${college.slug}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors group border border-transparent hover:border-purple-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-purple-700 truncate">{college.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {college.city}, {college.state}
                            {college.naac_grade ? ` · NAAC ${college.naac_grade}` : ''}
                            {` · ${college.type}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {college.nirf_rank && (
                            <div className="text-center">
                              <div className="text-xs font-bold text-indigo-600">#{college.nirf_rank}</div>
                              <div className="text-xs text-gray-400">NIRF</div>
                            </div>
                          )}
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-600">{formatFees(college.annual_fees_min, college.annual_fees_max)}</div>
                            <div className="text-xs text-gray-400">per year</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/colleges" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Browse all colleges →
                </Link>
              </div>
            )}

            <RelatedScholarships
              items={scholarships}
              title="Scholarships on the Way"
              subtitle="For the studies and entrance exams that lead into this career"
            />

            {/* Salary by Experience */}
            {generic && (career.avg_salary_min || career.avg_salary_max) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-500" /> Salary by Experience
              </h2>
              <div className="space-y-3">
                {[
                  { level: 'Entry Level (0–2 yrs)',    pct: 40, color: 'bg-blue-400',    min: career.avg_salary_min, max: career.avg_salary_min ? Math.round(career.avg_salary_min * 1.3) : null },
                  { level: 'Mid Level (3–7 yrs)',      pct: 65, color: 'bg-indigo-500',  min: career.avg_salary_min ? Math.round(career.avg_salary_min * 1.5) : null, max: career.avg_salary_max },
                  { level: 'Senior Level (8–15 yrs)',  pct: 85, color: 'bg-purple-500',  min: career.avg_salary_max, max: career.avg_salary_max ? Math.round(career.avg_salary_max * 1.8) : null },
                  { level: 'Expert / Lead (15+ yrs)',  pct: 100, color: 'bg-pink-500',   min: career.avg_salary_max ? Math.round(career.avg_salary_max * 1.5) : null, max: career.avg_salary_max ? Math.round(career.avg_salary_max * 3) : null },
                ].map(({ level, pct, color, min, max }) => (
                  <div key={level}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{level}</span>
                      <span className="text-green-700 font-semibold">{formatSalary(min, max)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-5">

            {/* Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Career Overview
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Category',    value: career.category,           Icon: Target     },
                  { label: 'Growth',      value: career.growth_level,       Icon: TrendingUp  },
                  { label: 'Competition', value: career.competition_level,  Icon: Scale      },
                  { label: 'Demand',      value: career.demand_score ? `${career.demand_score}/10` : null, Icon: BarChart3 },
                  { label: 'Work-Life',   value: career.work_life_balance ? `${career.work_life_balance}/5` : null, Icon: Heart },
                  { label: 'Trending',    value: career.is_trending ? 'Yes 🔥' : 'Stable',  Icon: Flame  },
                ].filter(item => item.value).map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><Icon className="w-3.5 h-3.5" />{label}</div>
                    <span className="text-xs font-medium text-gray-800">{value}</span>
                  </div>
                ))}
                {(career.avg_salary_min || career.avg_salary_max || career.official_pay_min) && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><IndianRupee className="w-3.5 h-3.5" />{career.avg_salary_min || career.avg_salary_max ? 'Salary' : 'Official pay'}</div>
                    <span className="text-xs font-medium text-green-700">
                      {career.avg_salary_min || career.avg_salary_max
                        ? formatSalary(career.avg_salary_min, career.avg_salary_max)
                        : `₹${career.official_pay_min.toLocaleString('en-IN')}/month`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <h3 className="text-sm font-semibold text-indigo-800 mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { href: '/recommend',              Icon: Target,    label: 'Get Recommendations' },
                  { href: `/roadmaps/${career.slug}`, Icon: Lightbulb, label: 'Career Roadmap'      },
                  { href: '/exams',                  Icon: BookOpen,  label: 'Browse Exams'        },
                  { href: '/colleges',               Icon: Building2, label: 'Browse Colleges'     },
                ].map(({ href, Icon, label }) => (
                  <Link key={label} href={href} className="flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900 transition-colors p-2 hover:bg-indigo-100 rounded-lg">
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Is this right for you */}
            {generic && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-green-500" /> Is this right for you?
              </h3>
              <div className="space-y-2">
                {[
                  { text: keySubjects.length ? `You enjoy ${keySubjects.join(' and ')}` : 'You enjoy the work this career involves', good: true },
                  { text: 'Manageable competition level', good: career.competition_level !== 'Very High' },
                  { text: 'Good work-life balance', good: (career.work_life_balance ?? 0) >= 4 },
                  { text: 'High job demand in market', good: (career.demand_score ?? 0) >= 7 },
                  { text: 'Strong growth potential', good: ['High', 'Very High'].includes(career.growth_level) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.good ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className={`text-xs ${item.good ? 'text-green-600' : 'text-red-500'}`}>{item.good ? '✓' : '✕'}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
              <Link href="/recommend" className="mt-4 block text-center text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Take Career Quiz →
              </Link>
            </div>
            )}

            {/* Similar Careers */}
            {similarCareers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Related Careers
                </h3>
                <div className="space-y-1">
                  {similarCareers.map((sc) => (
                    <Link key={sc.id} href={`/careers/${sc.slug}`}>
                      <div className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{sc.title}</p>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500" />
                        </div>
                        {(sc.avg_salary_min || sc.avg_salary_max) && (
                          <p className="text-xs text-green-600 mt-0.5">{formatSalary(sc.avg_salary_min, sc.avg_salary_max)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/careers" className="mt-3 block text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium">View all careers →</Link>
              </div>
            )}

            {/* Dashboard CTA */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
              <GraduationCap className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold text-sm mb-1">Track Your Progress</h3>
              <p className="text-xs text-indigo-200 mb-3">Save this career and track your journey on your dashboard.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-white text-indigo-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                Go to Dashboard <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
