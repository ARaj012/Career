'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronDown, CircleHelp, ExternalLink, Info, Sparkles, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { ListSkeleton } from '@/components/LoadingSkeleton'
import {
  FIELD_LABEL, LEVEL_LABEL, SOCIAL_LABEL, SPECIAL_LABEL, STATES,
  answersFromProfile, formatScholarshipAmount, matchScholarship,
  type Field, type Level, type ScholarshipLike, type Social, type Special, type StudentAnswers, type Verdict,
} from '@/lib/scholarship-match'

interface Scholarship extends ScholarshipLike {
  id: string
  provider: string | null
  amount_min: number | null
  amount_max: number | null
  amount_type: string | null
  application_url: string | null
}

const STORE_KEY = 'scholarship-match-answers'

const chip = (on: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm border transition ${on
    ? 'bg-emerald-600 border-emerald-600 text-white'
    : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400'}`

function Question({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div className={hint ? '' : 'mt-2'}>{children}</div>
    </div>
  )
}

function YesNo({ value, onChange }: { value?: boolean; onChange: (v?: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([['Yes', true], ['No', false]] as const).map(([l, v]) => (
        <button key={l} type="button" onClick={() => onChange(value === v ? undefined : v)} className={chip(value === v)}>{l}</button>
      ))}
    </div>
  )
}

export default function ScholarshipMatchPage() {
  const [all, setAll] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<StudentAnswers>({ special: [] })
  const [fromProfile, setFromProfile] = useState(false)
  const [showNo, setShowNo] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('scholarships')
        .select('id, slug, name, provider, level, state, category, field_of_study, eligibility_criteria, application_deadline, amount_min, amount_max, amount_type, application_url')
        .eq('is_active', true)
      setAll((data as Scholarship[]) ?? [])
      setLoading(false)

      // Answers from the last visit win over the profile
      let saved: StudentAnswers | null = null
      try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') } catch {}
      if (saved) { setAnswers({ special: [], ...saved }); return }
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: p } = await supabase
          .from('user_profiles')
          .select('class_level, current_education, stream, belonging_state, class12_state, state')
          .eq('user_id', user.id)
          .maybeSingle()
        if (p) {
          const pre = answersFromProfile(p)
          if (Object.keys(pre).length > 1) { setAnswers(pre); setFromProfile(true) }
        }
      } catch { /* signed-out visitors just fill the form */ }
    })()
  }, [supabase])

  const set = (patch: Partial<StudentAnswers>) => {
    setAnswers((prev) => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }
  const toggleSpecial = (s: Special) =>
    set({ special: answers.special?.includes(s) ? answers.special.filter((x) => x !== s) : [...(answers.special ?? []), s] })

  const results = useMemo(() => {
    const rows = all.map((s) => ({ s, v: matchScholarship(s, answers) }))
    const value = (s: Scholarship) => Number(s.amount_max ?? s.amount_min ?? 0) * (s.amount_type === 'monthly' || s.amount_type === 'stipend' ? 12 : 1)
    const order = (a: { s: Scholarship; v: Verdict }, b: { s: Scholarship; v: Verdict }) =>
      Number(a.v.closed) - Number(b.v.closed) || a.v.check.length - b.v.check.length || value(b.s) - value(a.s)
    return {
      eligible: rows.filter((r) => r.v.status === 'eligible').sort(order),
      check: rows.filter((r) => r.v.status === 'check').sort(order),
      no: rows.filter((r) => r.v.status === 'no').sort((a, b) => a.v.fails.length - b.v.fails.length),
    }
  }, [all, answers])

  const answered = [answers.level, answers.state, answers.social, answers.gender, answers.income, answers.field].filter((x) => x !== undefined).length

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/scholarships" className="inline-flex items-center gap-1.5 text-sm text-emerald-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> All scholarships
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Which scholarships can I get?</h1>
          <p className="text-emerald-50 mt-2 max-w-2xl">
            Answer a few questions. We check them against each scholarship&apos;s published eligibility rules and tell you where you
            qualify, where you need to confirm something, and why the rest don&apos;t fit.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[360px_1fr] gap-8 items-start">
        {/* Questions */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">About you</h2>
            <button type="button" onClick={() => { setAnswers({ special: [] }); setFromProfile(false); try { localStorage.removeItem(STORE_KEY) } catch {} }}
              className="text-xs text-gray-400 hover:text-red-600">Reset</button>
          </div>
          {fromProfile && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">Filled in from your profile — change anything that&apos;s different.</p>
          )}

          <Question label="What are you studying (or about to start)?">
            <select value={answers.level ?? ''} onChange={(e) => set({ level: (e.target.value || undefined) as Level | undefined })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Choose…</option>
              {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
            </select>
          </Question>

          <Question label="Your home state (domicile)">
            <select value={answers.state ?? ''} onChange={(e) => set({ state: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Choose…</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Question>

          <Question label="Category" hint="As on your caste / EWS certificate">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SOCIAL_LABEL) as Social[]).map((s) => (
                <button key={s} type="button" onClick={() => set({ social: answers.social === s ? undefined : s })} className={chip(answers.social === s)}>
                  {SOCIAL_LABEL[s]}
                </button>
              ))}
            </div>
          </Question>

          <Question label="From a notified minority community?" hint="Muslim, Christian, Sikh, Buddhist, Jain or Parsi">
            <YesNo value={answers.minority} onChange={(v) => set({ minority: v })} />
          </Question>

          <Question label="Gender">
            <div className="flex gap-2">
              {([['female', 'Female'], ['male', 'Male'], ['other', 'Other']] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => set({ gender: answers.gender === v ? undefined : v })} className={chip(answers.gender === v)}>{l}</button>
              ))}
            </div>
          </Question>

          <Question label="Family income a year" hint="All sources, as on your income certificate">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">₹</span>
              <input type="number" min={0} step={0.5} inputMode="decimal" placeholder="e.g. 2.5"
                value={answers.income ?? ''}
                onChange={(e) => set({ income: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-sm text-gray-500">lakh</span>
            </div>
          </Question>

          <Question label="Disability of 40% or more?" hint="With a disability certificate">
            <YesNo value={answers.disability} onChange={(v) => set({ disability: v })} />
          </Question>

          <Question label="Field of study">
            <select value={answers.field ?? ''} onChange={(e) => set({ field: (e.target.value || undefined) as Field | undefined })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Choose…</option>
              {(Object.keys(FIELD_LABEL) as Field[]).map((f) => <option key={f} value={f}>{FIELD_LABEL[f]}</option>)}
            </select>
          </Question>

          <Question label="Any of these true for you?" hint="Some scholarships are only for these students">
            <div className="space-y-2">
              {(Object.keys(SPECIAL_LABEL) as Special[]).map((s) => (
                <label key={s} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={!!answers.special?.includes(s)} onChange={() => toggleSpecial(s)}
                    className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  {SPECIAL_LABEL[s]}
                </label>
              ))}
            </div>
          </Question>
        </section>

        {/* Results */}
        <section className="space-y-6 min-w-0">
          {loading ? <ListSkeleton count={4} /> : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-wrap gap-6 items-center">
                <Stat n={results.eligible.length} label="you qualify for" tone="text-emerald-600" />
                <Stat n={results.check.length} label="worth checking" tone="text-amber-600" />
                <Stat n={results.no.length} label="not for you" tone="text-gray-400" />
                {answered < 4 && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 basis-full sm:basis-auto sm:ml-auto">
                    <Info className="w-4 h-4" /> Answer more questions for a sharper list.
                  </p>
                )}
              </div>

              <Group title="You qualify" icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} rows={results.eligible}
                empty="None yet where every rule is confirmed — see the ones worth checking below." />
              <Group title="Worth checking" icon={<CircleHelp className="w-5 h-5 text-amber-500" />} rows={results.check}
                subtitle="You may qualify — confirm the points marked ? on the official portal."
                empty="Nothing here." />

              {results.no.length > 0 && (
                <div>
                  <button type="button" onClick={() => setShowNo((x) => !x)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ChevronDown className={`w-4 h-4 transition ${showNo ? 'rotate-180' : ''}`} />
                    {showNo ? 'Hide' : 'Show'} the {results.no.length} that don&apos;t fit, and why
                  </button>
                  {showNo && (
                    <ul className="mt-3 bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                      {results.no.map(({ s, v }) => (
                        <li key={s.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <Link href={`/scholarships/${s.slug}`} className="text-sm font-medium text-gray-800 hover:text-emerald-700 sm:w-1/2">{s.name}</Link>
                          <span className="text-xs text-gray-500 flex items-start gap-1.5 sm:w-1/2">
                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{v.fails[0]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                Matching uses each scholarship&apos;s published eligibility rules as listed on this site. Rules and income limits can
                change each year — always read the official notice before you apply.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div>
      <p className={`text-3xl font-bold ${tone}`}>{n}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function Group({ title, subtitle, icon, rows, empty }: {
  title: string; subtitle?: string; icon: React.ReactNode; empty: string
  rows: { s: Scholarship; v: Verdict }[]
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">{icon}{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 mt-3">{empty}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          {rows.map(({ s, v }) => <ResultCard key={s.id} s={s} v={v} />)}
        </div>
      )}
    </div>
  )
}

function ResultCard({ s, v }: { s: Scholarship; v: Verdict }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/scholarships/${s.slug}`} className="font-semibold text-gray-900 hover:text-emerald-700 leading-snug">{s.name}</Link>
          {s.provider && <p className="text-xs text-gray-500 mt-0.5">{s.provider}</p>}
        </div>
        {v.closed && <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Closed this year</span>}
      </div>
      <p className="mt-3 text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4" /> {formatScholarshipAmount(s)}
      </p>

      <ul className="mt-3 space-y-1.5 text-sm">
        {v.met.map((m) => (
          <li key={m} className="flex gap-2 text-gray-700"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{m}</li>
        ))}
        {v.check.map((c) => (
          <li key={c} className="flex gap-2 text-amber-800"><CircleHelp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{c}</li>
        ))}
      </ul>
      {(v.notes.length > 0 || v.closed) && (
        <p className="mt-3 text-xs text-gray-500">
          {[...v.notes, ...(v.closed ? ['The last deadline has passed; it usually reopens in the next cycle'] : [])].join(' · ')}
        </p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        <Link href={`/scholarships/${s.slug}`} className="text-xs font-medium text-emerald-700 hover:underline">Full details →</Link>
        {s.application_url && (
          <a href={s.application_url} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium inline-flex items-center gap-1">
            Official portal <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </article>
  )
}
