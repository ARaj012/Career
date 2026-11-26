'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, ExternalLink, AlertTriangle, Play, Zap, Square } from 'lucide-react'

type Change = { old: unknown; new: unknown; evidence: string | null }
type Proposal = {
  id: string
  entity: string
  table_name: string
  record_id: string | null
  label: string
  changes: { fields: Record<string, Change> }
  source_url: string
  status: string
  reason: string | null
  created_at: string
  reviewed_by: string | null
}
type Run = {
  id: string
  started_at: string
  finished_at: string | null
  trigger: string
  mode: string
  status: string
  stats: Record<string, number | string[]>
  errors: { item: string; error: string }[]
}

const TABS = [
  { key: 'pending', label: 'Needs review' },
  { key: 'auto_applied', label: 'Auto-applied' },
  { key: 'applied', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const

// Steps that need no AI run first, so a used-up daily AI limit never blocks them
const SWEEP_TARGETS = [
  { key: 'nirf', label: 'College NIRF ranks' },
  { key: 'cutoffs', label: 'College cutoffs, JEE (JoSAA, one year per step)' },
  { key: 'placements', label: 'College placements & enrolment (NIRF data sheets)' },
  { key: 'exams', label: 'Exam dates' },
  { key: 'exam_rules', label: 'Exam pattern & eligibility' },
  { key: 'syllabus', label: 'Exam syllabus' },
  { key: 'exam_cutoffs', label: 'Exam cutoffs' },
  { key: 'college_details', label: 'College courses, fees, placements, admission' },
  { key: 'colleges', label: 'Colleges (NAAC, founded)' },
  { key: 'college_cutoffs', label: 'College cutoffs (NEET, CUET, CAT, CLAT, state CETs…)' },
  { key: 'careers', label: 'Careers (eligibility, route, pay)' },
  { key: 'scholarships', label: 'Scholarships' },
] as const
// A stopped "Update everything" (AI limit, closed tab, Stop) resumes from here within 2 days
const RESUME_KEY = 'automation-sweep'
type Resume = { startedAt: string; runId?: string; done: string[]; at: number }
function readResume(): Resume | null {
  try {
    const r = JSON.parse(localStorage.getItem(RESUME_KEY) ?? 'null') as Resume | null
    return r && Date.now() - r.at < 2 * 86_400_000 ? r : null
  } catch { return null }
}
function saveResume(r: Resume | null) {
  try { if (r) localStorage.setItem(RESUME_KEY, JSON.stringify(r)); else localStorage.removeItem(RESUME_KEY) } catch { /* storage blocked */ }
}
type SweepKey = (typeof SWEEP_TARGETS)[number]['key']
type SweepProgress = Record<SweepKey, { total: number; left: number; state: 'waiting' | 'running' | 'done' | 'stopped' }>

const FIELD_LABELS: Record<string, string> = {
  registration_start: 'Registration opens',
  registration_end: 'Registration closes',
  exam_date_start: 'Exam starts',
  exam_date_end: 'Exam ends',
  result_date: 'Result',
  application_deadline: 'Deadline',
  amount_min: 'Amount (min)',
  amount_max: 'Amount (max)',
  nirf_rank: 'NIRF rank',
  nirf_year: 'NIRF year',
  nirf_category: 'NIRF category',
  naac_grade: 'NAAC grade',
  established_year: 'Established',
  annual_fees_min: 'Annual fees (min)',
  annual_fees_max: 'Annual fees (max)',
  duration_minutes: 'Duration (minutes)',
  total_questions: 'Number of questions',
  total_marks: 'Total marks',
  marks_per_correct: 'Marks per correct answer',
  negative_marking: 'Marks deducted per wrong answer',
  min_percentage: 'Minimum % in qualifying exam',
  age_min: 'Minimum age',
  age_max: 'Maximum age',
  eligibility: 'Eligibility',
  application_opens: 'Applications open',
  application_closes: 'Applications close',
}

function show(v: unknown, field = ''): string {
  if (v === null || v === undefined || v === '') return '—'
  if (/year/.test(field)) return String(v)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    return new Date(v.length === 10 ? `${v}T00:00:00` : v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (typeof v === 'number' && v >= 1000) {
    // Money fields get a rupee sign; counts such as total marks (1,750) do not
    return /fee|amount|pay|package|salary|stipend/.test(field) ? `₹${v.toLocaleString('en-IN')}` : v.toLocaleString('en-IN')
  }
  if (Array.isArray(v)) return v.map((item) => show(item, field)).join(' · ')
  // Quoted facts are stored as { text, source_url }
  if (typeof v === 'object') return 'text' in v ? String((v as { text: unknown }).text) : JSON.stringify(v)
  return String(v)
}

/** A list value (e.g. eligibility facts) as bullet points; anything else as plain text */
function ValueList({ v, field, className = '' }: { v: unknown; field: string; className?: string }) {
  if (!Array.isArray(v) || v.length === 0) return <span className={className}>{show(v, field)}</span>
  return (
    <ul className={`list-disc pl-4 space-y-1 ${className}`}>
      {v.map((item, i) => <li key={i}>{show(item, field)}</li>)}
    </ul>
  )
}

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${m} min ago`
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`
  return `${Math.round(m / 1440)} days ago`
}

export default function AutomationPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pending')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [slug, setSlug] = useState('')
  const [sweep, setSweep] = useState<SweepProgress | null>(null)
  const [resumable, setResumable] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setResumable(!!readResume()) }, [])
  const stopRef = useRef(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/automation?status=${tab}`)
    const json = await res.json()
    setError(json.error ?? '')
    if (json.error) return setLoading(false)
    else {
      setProposals(json.proposals ?? [])
      setRuns(json.runs ?? [])
      setCounts(json.counts ?? {})
    }
    setSelected(new Set())
    setLoading(false)
  }, [tab])

  // Fetch on mount / tab change; state is only set after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const act = async (action: 'approve' | 'reject', ids: string[]) => {
    if (!ids.length) return
    setBusy(true)
    const res = await fetch('/api/admin/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.error) setError(json.error)
    else {
      setMessage(`${json.done.length} ${action === 'approve' ? 'approved and saved' : 'rejected'}${json.failed.length ? `, ${json.failed.length} failed: ${json.failed[0].error}` : ''}`)
      load()
    }
  }

  const runNow = async () => {
    setSweep(null)
    setBusy(true)
    setMessage(slug ? `Checking ${slug} against its official website…` : 'Checking exams with open or upcoming dates…')
    const res = await fetch('/api/admin/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', slug: slug.trim() || undefined }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.error) { setError(json.error); setMessage('') }
    else {
      const s = json.stats
      setMessage(`Checked ${s.checked}: ${s.auto_applied} updated automatically, ${s.pending} need review, ${s.skipped} unchanged/skipped.`)
      load()
    }
  }

  // Runs every target in ~40 s batches until nothing is left, so it works on
  // serverless hosts too. Closing the tab simply stops it; the next click resumes
  // with a fresh sweep and unchanged pages cost nothing.
  const updateEverything = async () => {
    // Resume a stopped sweep: records already checked since it began are skipped, finished steps too
    const resume = readResume()
    const startedAt = resume?.startedAt ?? new Date().toISOString()
    const doneKeys = new Set(resume?.done ?? [])
    const progress = Object.fromEntries(
      SWEEP_TARGETS.map(({ key }) => [key, { total: key === 'nirf' ? 1 : 0, left: key === 'nirf' ? 1 : 0, state: doneKeys.has(key) ? 'done' : 'waiting' }])
    ) as SweepProgress
    const totals = { checked: 0, auto_applied: 0, pending: 0, skipped: 0 }
    let runId: string | undefined = resume?.runId
    saveResume({ startedAt, runId, done: [...doneKeys], at: Date.now() })
    stopRef.current = false
    setBusy(true)
    setError('')
    setMessage('')
    setSweep({ ...progress })

    for (const { key } of SWEEP_TARGETS) {
      if (doneKeys.has(key)) continue
      progress[key].state = 'running'
      setSweep({ ...progress })
      let first = true
      // Step-wise targets (JoSAA years, NIRF placement batches) carry their position between requests
      let cursor: number | undefined
      while (!stopRef.current) {
        const res = await fetch('/api/admin/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sweep', target: key, startedAt, runId, cursor }),
        }).catch(() => null)
        const json = res ? await res.json().catch(() => ({ error: `Server returned ${res.status}` })) : { error: 'Network error' }
        if (json.error || json.quotaStop) {
          setError(json.error || json.quotaStop)
          stopRef.current = true
          break
        }
        runId = json.runId ?? runId
        cursor = json.cursor ?? cursor
        for (const k of Object.keys(totals) as (keyof typeof totals)[]) totals[k] += json.stats[k] ?? 0
        const left = json.remaining[key] as number
        if (first && key !== 'nirf') progress[key].total = json.dueAtStart[key]
        // JoSAA and NIRF placements learn their size on the first step
        if (!progress[key].total && json.dueAtStart[key]) progress[key].total = json.dueAtStart[key]
        first = false
        progress[key].left = left
        setSweep({ ...progress })
        if (left === 0) break
      }
      progress[key].state = stopRef.current ? 'stopped' : 'done'
      setSweep({ ...progress })
      if (stopRef.current) break
      doneKeys.add(key)
      saveResume({ startedAt, runId, done: [...doneKeys], at: Date.now() })
    }

    // Finished: the next click starts a fresh sweep
    if (!stopRef.current) saveResume(null)
    setResumable(stopRef.current)
    setBusy(false)
    setMessage(
      `${stopRef.current ? 'Stopped — click "Resume update" to carry on from here. ' : 'Done. '}Checked ${totals.checked} records: ${totals.auto_applied} updated automatically, ` +
        `${totals.pending} need your review, ${totals.skipped} unchanged or unreadable.`
    )
    load()
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const lastRun = runs[0]

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Exam dates, syllabus and cutoffs, scholarships, and college courses, fees, placements, ranks and admission cutoffs are read from official websites. A change is
            saved only when the official page contains it word for word. Changes to already-verified data wait here for you.
          </p>
          {lastRun && (
            <p className="text-xs text-gray-400 mt-2">
              Last run {ago(lastRun.started_at)} ({lastRun.trigger}, {lastRun.status})
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {sweep && busy ? (
            <button
              onClick={() => { stopRef.current = true }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Square className="w-4 h-4" /> Stop after this batch
            </button>
          ) : (
            <button
              onClick={updateEverything}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Zap className="w-4 h-4" /> {resumable ? 'Resume update' : 'Update everything'}
            </button>
          )}
          <div className="flex items-center gap-2">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="or one exam, e.g. gate"
              aria-label="Exam slug to check"
              className="w-44 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={runNow}
              disabled={busy || !slug.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {busy && !sweep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Check
            </button>
          </div>
        </div>
      </div>

      {sweep && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3" aria-live="polite">
          {SWEEP_TARGETS.map(({ key, label }) => {
            const p = sweep[key]
            const done = p.total ? p.total - p.left : 0
            const pct = p.state === 'done' ? 100 : p.total ? Math.round((done / p.total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{label}</span>
                  <span className="text-gray-500 tabular-nums">
                    {p.state === 'waiting' ? 'Waiting' : p.state === 'stopped' ? 'Stopped'
                      : key === 'nirf' ? (p.state === 'done' ? 'Done' : 'Reading nirfindia.org…')
                      : p.state === 'done' ? `${p.total} checked` : p.total ? `${done} of ${p.total}` : 'Starting…'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${p.state === 'stopped' ? 'bg-amber-400' : 'bg-indigo-600'} ${p.state === 'running' && !p.total ? 'animate-pulse w-1/12' : ''}`}
                    style={p.state === 'running' && !p.total ? undefined : { width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {busy && <p className="text-xs text-gray-400">Keep this tab open. Each official site is read politely, so a full update takes a while.</p>}
        </div>
      )}

      {error && <div role="alert" className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {message && !error && <div role="status" className="bg-indigo-50 text-indigo-800 text-sm px-4 py-3 rounded-lg mb-4">{message}</div>}

      <div className="flex gap-1 border-b border-gray-200 mb-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => { if (t.key !== tab) { setLoading(true); setTab(t.key) } }}
            className={`px-4 py-2 text-sm -mb-px border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              tab === t.key ? 'border-indigo-600 text-indigo-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {(counts[t.key] ?? 0) > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${t.key === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'pending' && proposals.length > 0 && (
        <div className="flex items-center gap-3 mb-3 text-sm">
          <label className="inline-flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              checked={selected.size === proposals.length}
              onChange={(e) => setSelected(e.target.checked ? new Set(proposals.map((p) => p.id)) : new Set())}
            />
            Select all
          </label>
          <button disabled={busy || !selected.size} onClick={() => act('approve', [...selected])}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700">
            Approve {selected.size || ''}
          </button>
          <button disabled={busy || !selected.size} onClick={() => act('reject', [...selected])}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50">
            Reject {selected.size || ''}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-12 text-center">Loading…</p>
      ) : proposals.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">
          {tab === 'pending' ? 'Nothing waiting for review.' : 'No changes in this list yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((p) => (
            <li key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                {tab === 'pending' && (
                  <input type="checkbox" className="mt-1" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.label}`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">{p.label}</h2>
                    <span className="text-xs text-gray-400">
                      {p.record_id ? 'Update' : 'New row'}, {ago(p.created_at)}
                      {p.reviewed_by && p.reviewed_by !== 'automation' ? `, by ${p.reviewed_by}` : ''}
                    </span>
                  </div>
                  {p.reason && (tab === 'pending' || tab === 'rejected') && (
                    <p className="flex items-start gap-1.5 text-sm text-amber-700 mt-1">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{tab === 'rejected' && <span className="font-medium">Why it was rejected: </span>}{p.reason}</span>
                    </p>
                  )}

                  <div className="mt-3 divide-y divide-gray-100">
                    {Object.entries(p.changes.fields).map(([field, c]) => (
                      <div key={field} className="py-2 grid sm:grid-cols-[10rem_1fr] gap-x-4 gap-y-1">
                        <div className="text-sm text-gray-500">{FIELD_LABELS[field] ?? field}</div>
                        <div>
                          {Array.isArray(c.old) || Array.isArray(c.new) ? (
                            // Lists of facts: show both versions in full so added or dropped items are easy to spot
                            <div className="text-sm grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Before ({Array.isArray(c.old) ? c.old.length : 0})</p>
                                <ValueList v={c.old} field={field} className="text-gray-500" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Proposed ({Array.isArray(c.new) ? c.new.length : 0})</p>
                                {c.new === null
                                  ? <span className="font-medium text-red-700">clear</span>
                                  : <ValueList v={c.new} field={field} className="text-gray-900" />}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="text-gray-500 line-through decoration-gray-300">{show(c.old, field)}</span>
                              <span className="text-gray-300 mx-2" aria-hidden>→</span>
                              <span className={`font-medium ${c.new === null ? 'text-red-700' : 'text-gray-900'}`}>
                                {c.new === null ? 'clear' : show(c.new, field)}
                              </span>
                            </div>
                          )}
                          {c.evidence && (
                            <blockquote className="mt-1 border-l-2 border-emerald-400 pl-3 text-sm text-gray-600 italic">
                              “{c.evidence}”
                            </blockquote>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <a href={p.source_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline break-all">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {p.source_url}
                    </a>
                    {tab === 'pending' && (
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => act('approve', [p.id])}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button disabled={busy} onClick={() => act('reject', [p.id])}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {runs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent runs</h2>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">How</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium text-right">Checked</th>
                  <th className="px-4 py-2 font-medium text-right">Updated</th>
                  <th className="px-4 py-2 font-medium text-right">Review</th>
                  <th className="px-4 py-2 font-medium text-right">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((r) => (
                  <tr key={r.id} title={r.errors.slice(0, 5).map((e) => `${e.item}: ${e.error}`).join('\n')}>
                    <td className="px-4 py-2 text-gray-700">{new Date(r.started_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-2 text-gray-500">{r.trigger}, {r.mode}</td>
                    <td className="px-4 py-2">
                      <span className={r.status === 'success' ? 'text-emerald-700' : r.status === 'failed' ? 'text-red-600' : r.status === 'running' ? 'text-indigo-600' : 'text-amber-700'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{Number(r.stats.checked ?? 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{Number(r.stats.auto_applied ?? 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{Number(r.stats.pending ?? 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-500">{r.errors.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
