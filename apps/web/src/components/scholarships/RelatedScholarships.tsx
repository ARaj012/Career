import Link from 'next/link'
import { Award, ChevronRight, MapPin } from 'lucide-react'
import { formatScholarshipAmount } from '@/lib/scholarship-match'

export interface RelatedScholarship {
  slug: string
  name: string
  provider: string | null
  state: string | null
  amount_min: number | string | null
  amount_max: number | string | null
  amount_type: string | null
  /** Why it is listed here, e.g. "A valid GATE score gets you ₹12,400 a month …" */
  note: string
  /** The exam it comes through, when listed on a career page */
  via?: string
}

type Row = { relevance_note: string; scholarships: Omit<RelatedScholarship, 'note' | 'via'> & { is_active: boolean | null } | null }

/** Turns rows from exam_scholarships / career_scholarships (joined to scholarships) into list items */
export function toRelated(rows: Row[] | null | undefined, via?: string): RelatedScholarship[] {
  return (rows ?? [])
    .filter((r) => r.scholarships && r.scholarships.is_active !== false)
    .map(({ relevance_note, scholarships: s }) => ({
      slug: s!.slug, name: s!.name, provider: s!.provider, state: s!.state,
      amount_min: s!.amount_min, amount_max: s!.amount_max, amount_type: s!.amount_type,
      note: relevance_note, via,
    }))
}

export const RELATED_SCHOLARSHIP_COLUMNS =
  'relevance_note, scholarships ( slug, name, provider, state, amount_min, amount_max, amount_type, is_active )'

const SHOWN = 5

function Item({ s }: { s: RelatedScholarship }) {
  const local = s.state && !/^all/i.test(s.state)
  return (
    <li>
      <Link href={`/scholarships/${s.slug}`}
        className="group flex items-start justify-between gap-3 p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700">{s.name}</p>
          <p className="text-xs text-gray-600 mt-1">
            {s.via && <span className="font-medium text-gray-700">Through {s.via}: </span>}
            {s.note}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-2">
            <span className="font-medium text-emerald-700">{formatScholarshipAmount(s)}</span>
            {local && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{s.state} only</span>}
            {s.provider && <span className="truncate max-w-full">{s.provider}</span>}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
      </Link>
    </li>
  )
}

export default function RelatedScholarships({ items, title = 'Scholarships', subtitle, className = '' }: {
  items: RelatedScholarship[]
  title?: string
  subtitle?: string
  className?: string
}) {
  if (!items.length) return null
  const shown = items.slice(0, SHOWN)
  const rest = items.slice(SHOWN)
  return (
    <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Award className="w-5 h-5 text-emerald-600" />
        {title}
        <span className="text-sm font-normal text-gray-400">({items.length})</span>
      </h2>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      <ul className="mt-4 space-y-2">
        {shown.map((s) => <Item key={s.slug} s={s} />)}
      </ul>
      {rest.length > 0 && (
        <details className="mt-2 group/more">
          <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 list-none">
            <span className="group-open/more:hidden">Show {rest.length} more</span>
            <span className="hidden group-open/more:inline">Show fewer</span>
          </summary>
          <ul className="mt-2 space-y-2">
            {rest.map((s) => <Item key={s.slug} s={s} />)}
          </ul>
        </details>
      )}
      <Link href="/scholarships/match" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        Check which scholarships you qualify for →
      </Link>
    </section>
  )
}
