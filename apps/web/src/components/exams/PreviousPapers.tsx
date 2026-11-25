'use client'

import { useState } from 'react'
import { BookOpen, ExternalLink, FileText, KeyRound } from 'lucide-react'

export interface PaperRow {
  url: string
  title: string
  kind: 'question_paper' | 'answer_key' | 'sample_paper'
  year: number | null
  source_url: string | null
}

const KIND = {
  question_paper: { label: 'Question paper', Icon: FileText, tone: 'text-indigo-600 bg-indigo-50' },
  answer_key: { label: 'Answer key', Icon: KeyRound, tone: 'text-emerald-700 bg-emerald-50' },
  sample_paper: { label: 'Sample paper', Icon: BookOpen, tone: 'text-amber-700 bg-amber-50' },
} as const

const host = (u: string) => { try { return new URL(u).host.replace(/^www\./, '') } catch { return '' } }
const fileName = (u: string) => { try { return decodeURIComponent(new URL(u).pathname.split('/').pop() ?? '') } catch { return '' } }

/** Past papers and answer keys, grouped by year; every link opens the official copy. */
export default function PreviousPapers({ papers, examName, officialUrl }: {
  papers: PaperRow[]; examName: string; officialUrl: string | null
}) {
  const [all, setAll] = useState(false)

  if (!papers.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Previous year papers</h2>
        <p className="text-xs sm:text-sm text-gray-500">
          We haven&apos;t found {examName} question papers on the official website yet — we check it every month.{' '}
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Official website →</a>
          )}
        </p>
      </div>
    )
  }

  const years = new Map<string, PaperRow[]>()
  for (const p of papers) {
    const k = p.year ? String(p.year) : 'Other'
    if (!years.has(k)) years.set(k, [])
    years.get(k)!.push(p)
  }
  const groups = [...years.entries()].sort(([a], [b]) => (a === 'Other' ? 1 : b === 'Other' ? -1 : Number(b) - Number(a)))
  const shown = all ? groups : groups.slice(0, 3)
  const hosts = [...new Set(papers.map((p) => host(p.url)))].filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Previous year papers</h2>
        <span className="text-xs text-gray-500">{papers.length} files · {groups.filter(([y]) => y !== 'Other').length} years</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Official copies — each link opens the file on {hosts.slice(0, 2).join(' / ')}.
      </p>

      <div className="space-y-4">
        {shown.map(([year, rows]) => (
          <div key={year}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{year}</h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {rows.map((p) => {
                const k = KIND[p.kind]
                return (
                  <li key={p.url}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 px-3 py-2.5 transition">
                      <span className={`shrink-0 rounded-lg p-1.5 ${k.tone}`}><k.Icon className="w-4 h-4" /></span>
                      <span className="min-w-0">
                        <span className="block text-sm text-gray-800 group-hover:text-indigo-700 leading-snug">{p.title}</span>
                        <span className="block text-[11px] text-gray-500 truncate">{k.label} · {fileName(p.url)}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 shrink-0 mt-1 ml-auto" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {groups.length > 3 && (
        <button type="button" onClick={() => setAll((x) => !x)} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800">
          {all ? 'Show recent years only' : `Show all ${groups.length} years`}
        </button>
      )}
    </div>
  )
}
