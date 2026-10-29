'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Flame,
  Info, Loader2, RotateCcw, SearchX, SlidersHorizontal, Sparkles, TrendingUp, Trophy,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'


interface Subject {
  id: string
  name: string
  stream: string
}

interface SubjectInput {
  subject_id: string
  name: string
  score: number
  interest: number
}

interface CareerResult {
  id: string
  title: string
  slug: string
  category: string
  avg_salary_min: number
  avg_salary_max: number
  growth_level: string
  demand_score: number
  is_trending: boolean
  description: string
  match_score: number
  matched_subjects: number
}

const STREAMS = [
  { name: 'Science', emoji: '🔬', tint: 'bg-sky-50', blurb: 'Labs, logic and how things work', subjects: ['Physics', 'Chemistry', 'Biology', 'Maths'] },
  { name: 'Commerce', emoji: '📊', tint: 'bg-emerald-50', blurb: 'Money, markets and business', subjects: ['Accountancy', 'Economics', 'Business Studies'] },
  { name: 'Arts', emoji: '🎨', tint: 'bg-rose-50', blurb: 'People, society and ideas', subjects: ['History', 'Geography', 'Political Science'] },
]

const STEPS = ['Choose Stream', 'Rate Subjects', 'View Results']

const INTEREST_LEVELS = [
  { level: 1, emoji: '😴', label: 'Not at all' },
  { level: 2, emoji: '😐', label: 'A little' },
  { level: 3, emoji: '🙂', label: 'Okay' },
  { level: 4, emoji: '😊', label: 'Like it' },
  { level: 5, emoji: '😍', label: 'Love it' },
]

const SUBJECT_EMOJI: [RegExp, string][] = [
  [/math/i, '🧮'], [/physic/i, '⚛️'], [/chem/i, '🧪'], [/bio/i, '🧬'],
  [/computer|informatics|coding|programming/i, '💻'], [/english|language|literature|hindi/i, '📖'],
  [/physical education|sport/i, '⚽'], [/account/i, '🧾'], [/econ/i, '📈'], [/business/i, '💼'],
  [/history/i, '🏛️'], [/geograph/i, '🌍'], [/politic/i, '⚖️'], [/psycholog/i, '🧠'],
  [/sociolog/i, '👥'], [/art|paint|design/i, '🎨'], [/music/i, '🎵'],
]
const subjectEmoji = (name: string) => SUBJECT_EMOJI.find(([re]) => re.test(name))?.[1] ?? '📘'

function marksBand(score: number) {
  if (score >= 90) return { emoji: '🌟', label: 'Outstanding', pill: 'bg-emerald-50 text-emerald-700' }
  if (score >= 75) return { emoji: '🎯', label: 'Great', pill: 'bg-indigo-50 text-indigo-700' }
  if (score >= 60) return { emoji: '👍', label: 'Good', pill: 'bg-sky-50 text-sky-700' }
  if (score >= 40) return { emoji: '📚', label: 'Average', pill: 'bg-amber-50 text-amber-700' }
  return { emoji: '💪', label: 'Needs work', pill: 'bg-gray-100 text-gray-600' }
}

/**
 * The score is marks × interest over the subjects a career needs, so 75 marks
 * at interest 3 gives 45%. Bands follow that scale rather than exam grades.
 */
function scoreBand(score: number) {
  if (score >= 70) return { label: 'Strong match', text: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', ring: '#10b981' }
  if (score >= 50) return { label: 'Good match', text: 'text-indigo-600', pill: 'bg-indigo-50 text-indigo-700', bar: 'bg-indigo-500', ring: '#6366f1' }
  if (score >= 30) return { label: 'Fair match', text: 'text-amber-600', pill: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500', ring: '#f59e0b' }
  return { label: 'Weak match', text: 'text-gray-500', pill: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400', ring: '#9ca3af' }
}

const formatSalary = (c: CareerResult) =>
  `₹${(c.avg_salary_min / 100000).toFixed(0)}L – ₹${(c.avg_salary_max / 100000).toFixed(0)}L / yr`

const growthChip = (level: string) =>
  level === 'Very High' ? 'bg-emerald-50 text-emerald-700' :
  level === 'High' ? 'bg-sky-50 text-sky-700' :
  'bg-gray-100 text-gray-600'

function CareerChips({ career }: { career: CareerResult }) {
  return (
    <div className="flex flex-wrap gap-2">
      {career.category && (
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{career.category}</span>
      )}
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{formatSalary(career)}</span>
      {career.growth_level && (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${growthChip(career.growth_level)}`}>
          <TrendingUp className="h-3 w-3" /> {career.growth_level} growth
        </span>
      )}
      {career.is_trending && (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
          <Flame className="h-3 w-3" /> Trending
        </span>
      )}
      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
        Demand {career.demand_score}/10
      </span>
      {career.matched_subjects > 0 && (
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          ✓ Uses {career.matched_subjects} of your subjects
        </span>
      )}
    </div>
  )
}

export default function RecommendPage() {
  const [, setSubjects] = useState<Subject[]>([])
  const [selectedStream, setSelectedStream] = useState('Science')
  const [loadedStream, setLoadedStream] = useState<string | null>(null)
  const [subjectInputs, setSubjectInputs] = useState<SubjectInput[]>([])
  const [results, setResults] = useState<CareerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1) // 1=stream, 2=subjects, 3=results

  const supabase = createClient()
  const subjectsLoading = loadedStream !== selectedStream

  // Fetch subjects when stream changes
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .or(`stream.eq.${selectedStream},stream.eq.All`)

      if (data) {
        setSubjects(data)
        setSubjectInputs(
          data.map(s => ({
            subject_id: s.id,
            name: s.name,
            score: 75,
            interest: 3
          }))
        )
      }
      setLoadedStream(selectedStream)
    }
    fetchSubjects()
  }, [selectedStream])

  const goTo = (next: number) => {
    setStep(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateSubjectScore = (id: string, score: number) => {
    setSubjectInputs(prev =>
      prev.map(s => s.subject_id === id ? { ...s, score } : s)
    )
  }

  const updateSubjectInterest = (id: string, interest: number) => {
    setSubjectInputs(prev =>
      prev.map(s => s.subject_id === id ? { ...s, interest } : s)
    )
  }

  const getRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: subjectInputs })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(response.status === 401
          ? 'Please sign in to see your career matches.'
          : data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setResults(data.recommendations || [])
      goTo(3)

      // Auto-save the recommendation session
      await saveRecommendationSession(data.recommendations || [])
    } catch (error) {
      console.error('Error:', error)
      setError('Could not reach the server. Please try again.')
    }
    setLoading(false)
  }

  const saveRecommendationSession = async (recommendations: CareerResult[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_recommendation_history')
        .insert({
          user_id: user.id,
          stream: selectedStream,
          subjects: subjectInputs,
          recommendations: recommendations
        })

      if (error) {
        console.error('Error saving recommendation session:', error)
      }
    } catch (error) {
      console.error('Error in saveRecommendationSession:', error)
    }
  }

  const [top, ...rest] = results

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50/70 via-gray-50 to-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">

        {/* Header */}
        {/* Header: full intro on the first step, compact once the student is under way */}
        <div className={`text-center ${step === 1 ? 'mb-8' : 'mb-6'}`}>
          {step === 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Career match in 3 steps
            </span>
          )}
          <h1 className={`font-extrabold tracking-tight text-gray-900 ${step === 1 ? 'mt-4 text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
            Find Your Perfect Career
          </h1>
          {step === 1 && (
            <p className="mx-auto mt-3 max-w-xl text-base text-gray-500 sm:text-lg">
              Tell us about your subjects and interests — we will match you with the best careers
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <ol className="mx-auto mb-8 flex max-w-xl items-center">
          {STEPS.map((label, i) => {
            const num = i + 1
            const done = step > num
            const current = step === num
            return (
              <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    done ? 'bg-indigo-600 text-white' :
                    current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                    'border border-gray-200 bg-white text-gray-400'
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : num}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-semibold sm:text-sm ${
                    current ? 'text-gray-900' : done ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-2 mb-6 h-0.5 flex-1 overflow-hidden rounded-full bg-gray-200 sm:mx-3 sm:mb-0">
                    <div className={`h-full bg-indigo-600 transition-all duration-500 ${done ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {/* STEP 1: Choose Stream */}
        {step === 1 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">What stream are you in?</h2>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">This helps us show you the most relevant subjects</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
              {STREAMS.map(({ name, emoji, tint, blurb, subjects }) => {
                const selected = selectedStream === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedStream(name)}
                    aria-pressed={selected}
                    className={`group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all md:flex-col md:p-5 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600'
                        : 'border-gray-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110 ${tint}`} aria-hidden>
                      {emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold text-gray-900">{name}</span>
                      <span className="block text-sm text-gray-500">{blurb}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {subjects.map((s) => (
                          <span key={s} className="rounded-md bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">{s}</span>
                        ))}
                      </span>
                    </span>
                    <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full transition ${
                      selected ? 'bg-indigo-600 text-white' : 'border border-gray-300 bg-white text-transparent group-hover:border-indigo-300'
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => goTo(2)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:mt-8 sm:py-4 sm:text-lg"
            >
              Continue with {selectedStream} <ArrowRight className="h-5 w-5" />
            </button>
          </section>
        )}

        {/* STEP 2: Rate Subjects */}
        {step === 2 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Rate your subjects</h2>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Set your marks and how much you enjoy each subject
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {selectedStream} · {subjectInputs.length} subjects
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {subjectsLoading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-gray-200 p-5">
                    <div className="h-5 w-40 rounded bg-gray-200" />
                    <div className="mt-5 h-2 rounded-full bg-gray-100" />
                    <div className="mt-5 grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4].map((j) => <div key={j} className="h-12 rounded-xl bg-gray-100" />)}
                    </div>
                  </div>
                ))
              ) : subjectInputs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  No subjects found for {selectedStream}. Go back and pick another stream.
                </div>
              ) : subjectInputs.map((subject) => {
                const marks = marksBand(subject.score)
                return (
                <div key={subject.subject_id} className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/60 p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl" aria-hidden>
                        {subjectEmoji(subject.name)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{subject.name}</h3>
                        <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${marks.pill}`}>
                          {marks.emoji} {marks.label}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-2xl font-extrabold tabular-nums text-indigo-600">
                      {subject.score}<span className="text-sm font-semibold text-gray-400">/100</span>
                    </span>
                  </div>

                  {/* Score Slider */}
                  <label className="mt-3 block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your marks</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={subject.score}
                      onChange={(e) => updateSubjectScore(subject.subject_id, Number(e.target.value))}
                      style={{ background: `linear-gradient(to right, #4f46e5 ${subject.score}%, #e5e7eb ${subject.score}%)` }}
                      className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-indigo-600 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
                    />
                  </label>
                  <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>

                  {/* Interest Rating */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">How much do you enjoy it?</span>
                      <span className="text-xs font-semibold text-indigo-600">
                        {INTEREST_LEVELS[subject.interest - 1]?.emoji} {INTEREST_LEVELS[subject.interest - 1]?.label}
                      </span>
                    </div>
                    <div role="radiogroup" aria-label={`Interest in ${subject.name}`} className="mt-2 grid grid-cols-5 gap-1.5 sm:gap-2">
                      {INTEREST_LEVELS.map(({ level, emoji, label }) => {
                        const selected = subject.interest === level
                        return (
                          <button
                            key={level}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={label}
                            onClick={() => updateSubjectInterest(subject.subject_id, level)}
                            className={`group flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 text-center transition-all duration-200 ${
                              selected
                                ? 'scale-[1.04] border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
                                : 'border-gray-200 bg-white text-gray-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50'
                            }`}
                          >
                            <span className={`text-2xl leading-none transition-all duration-200 sm:text-3xl ${
                              selected ? 'scale-110' : 'opacity-75 group-hover:scale-110 group-hover:opacity-100'
                            }`} aria-hidden>
                              {emoji}
                            </span>
                            <span className="text-[10px] font-semibold leading-tight sm:text-xs">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>

            {error && (
              <div role="alert" className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error}{' '}
                  {error.startsWith('Please sign in') && (
                    <Link href="/login" className="font-semibold underline">Sign in</Link>
                  )}
                </span>
              </div>
            )}

            {/* Sticks to the bottom of the screen so the long subject list never hides it; the
                right margin below lg keeps it clear of the floating chat button. */}
            <div className="sticky bottom-3 z-10 mr-12 mt-6 flex gap-2 rounded-2xl border border-gray-200 bg-white/90 p-2 shadow-lg backdrop-blur sm:mt-8 sm:gap-3 lg:mr-0">
              <button
                type="button"
                onClick={() => goTo(1)}
                aria-label="Back"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 sm:px-6"
              >
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
              </button>
              <button
                type="button"
                onClick={getRecommendations}
                disabled={loading || subjectsLoading || subjectInputs.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-base font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Finding <span className="hidden sm:inline">your</span> matches…</>
                ) : (
                  <>Get My <span className="hidden sm:inline">Career</span> Matches <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Results */}
        {step === 3 && (
          <section>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Top Career Matches</h2>
              <p className="mt-1 text-gray-500">Based on your {selectedStream} subjects and interest levels</p>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                  <SearchX className="h-7 w-7" />
                </span>
                <p className="mt-4 text-lg font-semibold text-gray-900">No matches found</p>
                <p className="mt-1 text-sm text-gray-500">Try raising your marks or interest levels for a few subjects.</p>
                <button type="button" onClick={() => goTo(2)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                  <SlidersHorizontal className="h-4 w-4" /> Adjust my ratings
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top match */}
                <Link
                  href={`/careers/${top.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
                    <Trophy className="h-4 w-4" /> Your best match
                  </div>
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div
                      className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-full sm:mx-0"
                      style={{ background: `conic-gradient(${scoreBand(top.match_score).ring} ${top.match_score * 3.6}deg, #eef2ff 0deg)` }}
                    >
                      <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white">
                        <span className={`text-3xl font-extrabold tabular-nums ${scoreBand(top.match_score).text}`}>{top.match_score}%</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">match</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBand(top.match_score).pill}`}>
                        {scoreBand(top.match_score).label}
                      </span>
                      <h3 className="mt-2 text-2xl font-bold text-gray-900 group-hover:text-indigo-700">{top.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{top.description}</p>
                      <div className="mt-4 flex justify-center sm:justify-start"><CareerChips career={top} /></div>
                    </div>
                    <span className="hidden items-center gap-1 self-center text-sm font-semibold text-indigo-600 sm:flex">
                      Explore <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>

                {/* Score explanation */}
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <div>
                    <p>
                      <span className="font-semibold text-gray-900">How the score works:</span> your marks × your interest
                      in the subjects each career relies on. 100% means full marks and “Love it” in every one of them, so
                      raising your interest moves scores the most.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {[70, 50, 30, 0].map((min) => {
                        const b = scoreBand(min)
                        return (
                          <span key={min} className="inline-flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${b.bar}`} />
                            {b.label} {min === 0 ? '(<30%)' : `(${min}%+)`}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {rest.length > 0 && (
                  <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-gray-500">More careers for you</h3>
                )}
                {rest.map((career, i) => {
                  const band = scoreBand(career.match_score)
                  return (
                    <Link
                      key={career.id}
                      href={`/careers/${career.slug}`}
                      className="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md sm:p-5"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                          #{i + 2}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700">{career.title}</h4>
                          <p className="line-clamp-2 text-sm text-gray-500">{career.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`text-2xl font-extrabold tabular-nums ${band.text}`}>{career.match_score}%</div>
                          <div className="text-xs font-medium text-gray-400">{band.label}</div>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${band.bar} transition-all duration-700`} style={{ width: `${career.match_score}%` }} />
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <CareerChips career={career} />
                        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Try Again */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => goTo(2)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4" /> Adjust ratings
              </button>
              <button
                type="button"
                onClick={() => { goTo(1); setResults([]) }}
                className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white py-3.5 font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
