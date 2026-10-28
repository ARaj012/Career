'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, ChevronDown, ExternalLink, Sparkles } from 'lucide-react'

export interface OfficialSyllabusRow {
  subject: string
  topic: string | null
  stage: string | null
  sort_order: number | null
  added_at: string | null
}

export interface SyllabusChanges {
  date: string
  edition: number | null
  added: { subject: string; topic: string }[]
  removed: { subject: string; topic: string }[]
  source_url: string
}

/** The conducting body's own syllabus, unit by unit, with what changed in the latest edition. */
export default function OfficialSyllabus({
  rows,
  sourceUrl,
  verifiedAt,
  changes,
}: {
  rows: OfficialSyllabusRow[]
  sourceUrl: string | null
  verifiedAt: string | null
  changes: SyllabusChanges | null
}) {
  const groups = useMemo(() => {
    const map = new Map<string, OfficialSyllabusRow[]>()
    for (const r of [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
      const key = r.stage ? `${r.stage} · ${r.subject}` : r.subject
      map.set(key, [...(map.get(key) ?? []), r])
    }
    return [...map.entries()]
  }, [rows])
  const [open, setOpen] = useState<string | null>(groups[0]?.[0] ?? null)
  // "New" = added in the latest official change
  const isNew = (r: OfficialSyllabusRow) => !!changes && r.added_at?.slice(0, 10) === changes.date
  const recentChange = changes

  if (!rows.length && !sourceUrl) return null

  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Official Syllabus</h2>
          <p className="text-gray-500">Every unit, as published by the conducting body</p>
        </div>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
            <BadgeCheck className="w-4 h-4" /> Official source
            {verifiedAt && <span className="text-gray-400">· checked {new Date(verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {recentChange && (recentChange.added.length > 0 || recentChange.removed.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
          <p className="font-semibold text-amber-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Syllabus changed{recentChange.edition ? ` for ${recentChange.edition}` : ''}
            <span className="font-normal text-amber-700 text-sm">· noticed {new Date(recentChange.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
          {recentChange.added.length > 0 && (
            <p className="text-sm text-amber-900 mt-2">
              <span className="font-medium">Added:</span> {recentChange.added.map((t) => `${t.topic} (${t.subject})`).join(', ')}
            </p>
          )}
          {recentChange.removed.length > 0 && (
            <p className="text-sm text-amber-900 mt-1">
              <span className="font-medium">Removed:</span> {recentChange.removed.map((t) => `${t.topic} (${t.subject})`).join(', ')}
            </p>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-2xl p-5">
          The syllabus is published as separate documents for each paper. Open the{' '}
          <a href={sourceUrl!} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">official syllabus page</a>{' '}
          and download the one for your paper.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map(([name, units]) => (
            <div key={name} className="bg-white border border-gray-200 rounded-2xl">
              <button
                type="button"
                onClick={() => setOpen(open === name ? null : name)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={open === name}
              >
                <span className="font-semibold text-gray-900">{name}</span>
                <span className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                  {units.length} unit{units.length !== 1 ? 's' : ''}
                  <ChevronDown className={`w-4 h-4 transition-transform ${open === name ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {open === name && (
                <ol className="px-5 pb-4 space-y-1.5 list-decimal list-inside text-sm text-gray-800">
                  {units.map((u) => (
                    <li key={u.topic}>
                      {u.topic}
                      {isNew(u) && <span className="ml-2 text-[11px] font-semibold text-amber-800 bg-amber-100 rounded-full px-2 py-0.5">New</span>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
