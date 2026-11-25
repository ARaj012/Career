import { Info } from 'lucide-react'
import EstimateNote from '@/components/EstimateNote'
import type { Estimate } from '@/lib/estimates'

export type ScheduleRow = {
  year: number | null
  session: string | null
  registration_start: string | null
  registration_end: string | null
  exam_date_start: string | null
  exam_date_end: string | null
  result_date: string | null
  data_status: string | null
  source_url: string | null
  verified_at: string | null
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function range(a: string | null, b: string | null) {
  if (!a && !b) return 'Not announced'
  if (!b || a === b) return formatDate(a ?? b)
  return `${formatDate(a) ?? 'TBA'} – ${formatDate(b)}`
}

const dates = (s: ScheduleRow) =>
  [s.registration_start, s.registration_end, s.exam_date_start, s.exam_date_end, s.result_date].filter(Boolean) as string[]

/**
 * The cycle a student cares about: the earliest year that still has a date
 * today or later; if every stored date has passed, the latest year (shown as past).
 */
export function pickCycle(schedules: ScheduleRow[], today = new Date().toISOString().slice(0, 10)) {
  const years = [...new Set(schedules.map((s) => s.year).filter((y): y is number => y !== null))].sort((a, b) => a - b)
  const upcoming = years.find((y) => schedules.some((s) => s.year === y && dates(s).some((d) => d.slice(0, 10) >= today)))
  const year = upcoming ?? years[years.length - 1]
  const sessions = schedules
    .filter((s) => s.year === year)
    .sort((a, b) => (a.exam_date_start ?? a.registration_start ?? '9999').localeCompare(b.exam_date_start ?? b.registration_start ?? '9999'))
  return { year, sessions, isPast: upcoming === undefined }
}

export type ExpectedStep = { label: string; when: string; note: string | null }
export type ExpectedGroup = { title: string | null; steps: ExpectedStep[] }

const balanced = (s: string) => (s.match(/\(/g)?.length ?? 0) === (s.match(/\)/g)?.length ?? 0)

/** "notification ~Nov–Dec 2026" → { label: "Notification", when: "Nov–Dec 2026" }; null if it doesn't read as one step */
function parseStep(part: string): ExpectedStep | null {
  const m = /^(.*?)\s*~\s*(.+?)\s*(?:\(([^()]+)\))?\s*\.?$/.exec(part.trim())
  if (!m || !m[1]) return null
  const label = m[1].trim()
  const when = m[2].trim().replace(/\.$/, '')
  if (label.length > 45 || when.length > 40 || when.includes('~') || !balanced(label) || !balanced(when)) return null
  return { label: label.charAt(0).toUpperCase() + label.slice(1), when, note: m[3]?.trim() ?? null }
}

/**
 * "Registration ~December 2026–February 2027 · Exam ~March–April 2027" → steps with a
 * label and a time window. Leading sentences without a window become the intro; a line
 * like "CDS I 2027: notification ~December 2026, exam ~April 2027" becomes a titled group.
 * Null when any part doesn't read cleanly, so the text is shown as written instead.
 */
export function parseExpectedSchedule(text: string): { intro: string | null; groups: ExpectedGroup[] } | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const first = lines.findIndex((l) => l.includes('~'))
  if (first < 0) return null
  const introLines = lines.slice(0, first)
  const groups: ExpectedGroup[] = []
  for (const line of lines.slice(first)) {
    if (!line.includes('~')) return null
    const colon = line.lastIndexOf(': ', line.indexOf('~'))
    const title = colon > 0 ? line.slice(0, colon).trim() : null
    const body = colon > 0 ? line.slice(colon + 2) : line
    const steps = body.split(/\s+·\s+|,\s+(?=[^,]*~)/).map(parseStep)
    if (!steps.length || steps.some((s) => !s)) return null
    groups.push({ title, steps: steps as ExpectedStep[] })
  }
  // A lone group's heading ("Per SSC's annual calendar") reads as the intro
  if (groups.length === 1 && groups[0].title) {
    introLines.push(groups[0].title)
    groups[0].title = null
  }
  return { intro: introLines.join(' ') || null, groups }
}

const STEP_GRID: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }

/** The expected timeline for a cycle the official site has not announced yet. */
function ExpectedSchedule({ estimate, year }: { estimate: Estimate; year: number | null }) {
  const parsed = parseExpectedSchedule(estimate.value_text)
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Expected schedule{year ? ` for ${year}` : ''}</h3>
          {parsed?.intro && <p className="text-xs text-gray-500 mt-0.5">{parsed.intro}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          Estimate · not official yet
        </span>
      </div>

      <div className="p-4">
        {parsed ? (
          <div className="space-y-4">
            {parsed.groups.map((g, gi) => (
              <div key={gi}>
                {g.title && <h4 className="mb-2 text-xs font-semibold text-gray-700">{g.title}</h4>}
                <ol className={`grid grid-cols-1 gap-3 ${STEP_GRID[Math.min(g.steps.length, 4)]}`}>
                  {g.steps.map((s, i) => (
                    <li key={i} className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900">{s.when}</p>
                      {s.note && <p className="mt-1 text-xs text-gray-500">{s.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-line">{estimate.value_text}</p>
        )}
      </div>

      <p className="flex items-start gap-1.5 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
        <Info className="mt-px h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
        <span>
          {estimate.basis ? `${estimate.basis} ` : ''}We'll replace this with the official dates as soon as they're published.
        </span>
      </p>
    </div>
  )
}

function StatusLine({ s }: { s: ScheduleRow }) {
  if (s.data_status === 'verified' || s.data_status === 'tentative') {
    return (
      <p className="text-xs text-emerald-700 mt-3">
        ✓ {s.data_status === 'tentative' ? 'Tentative dates from the' : 'Confirmed from the'}{' '}
        {s.source_url ? (
          <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-900">official website</a>
        ) : 'official website'}
        {s.verified_at ? `, checked ${formatDate(s.verified_at)}` : ''}
      </p>
    )
  }
  return <p className="text-xs text-amber-700 mt-3">Not yet confirmed from the official website; dates may change.</p>
}

export default function KeyDates({ schedules, officialUrl, estimate }: { schedules: ScheduleRow[]; officialUrl: string | null; estimate?: Estimate }) {
  const today = new Date().toISOString().slice(0, 10)
  const cycle = pickCycle(schedules, today)
  const { year, isPast } = cycle
  // Past dates are only worth showing as a reference when the official site confirmed them
  const sessions = isPast ? cycle.sessions.filter((s) => s.data_status === 'verified' || s.data_status === 'tentative') : cycle.sessions
  const multi = sessions.length > 1 || sessions.some((s) => s.session && s.session !== 'Default')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        📅 Key Dates{year && !(isPast && !sessions.length) ? ` (${year})` : ''}
        {multi && <span className="ml-2 text-sm font-normal text-gray-500">{sessions.length} sessions</span>}
      </h2>

      {isPast && sessions.length > 0 && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          The {year} cycle is over. Dates for {year! + 1} have not been announced on the official website yet.
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">
          {year && isPast ? `Dates for ${year + 1} haven't been announced on the official website yet.` : "Exact dates for the upcoming cycle haven't been announced yet."}{' '}
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              Check the official site →
            </a>
          )}
        </p>
      ) : null}
      {(sessions.length === 0 || isPast) && estimate && (
        <div className={sessions.length ? 'mb-4' : 'mt-4'}>
          {estimate.kind === 'estimate' ? (
            <ExpectedSchedule estimate={estimate} year={year && isPast ? year + 1 : null} />
          ) : (
            <EstimateNote estimate={estimate} title={estimate.kind === 'discontinued' ? undefined : `Expected schedule${year && isPast ? ` for ${year + 1}` : ''}`} />
          )}
        </div>
      )}
      {sessions.length === 0 ? null : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const done = dates(s).length > 0 && dates(s).every((d) => d.slice(0, 10) < today)
            return (
              <div key={`${s.year}-${s.session}`} className={multi ? 'border border-gray-100 rounded-xl p-3 sm:p-4' : ''}>
                {multi && (
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-gray-900">{s.session && s.session !== 'Default' ? s.session : 'Main session'}</h3>
                    {done && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Completed</span>}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Registration</p>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">{range(s.registration_start, s.registration_end)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Exam Date</p>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">{range(s.exam_date_start, s.exam_date_end)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Result Date</p>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">{formatDate(s.result_date) ?? 'Not announced'}</p>
                  </div>
                </div>
                <StatusLine s={s} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
