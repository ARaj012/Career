import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, FileText, KeyRound } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Previous year question papers | CareerGuide',
  description: 'Official previous-year question papers and answer keys for entrance and recruitment exams, linked from each exam board’s website.',
}

export const revalidate = 3600

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

interface Summary {
  exam_id: string
  files: number
  years: number
  latest_year: number | null
  earliest_year: number | null
  question_papers: number
  answer_keys: number
}

export default async function PapersPage() {
  const db = await createServerSupabaseClient()
  const [{ data: summary }, { data: exams }] = await Promise.all([
    db.from('exam_paper_summary').select('*'),
    db.from('exams').select('id, name, slug, conducting_body, exam_level'),
  ])
  const byId = new Map((exams ?? []).map((e) => [e.id as string, e]))
  const rows = ((summary ?? []) as Summary[])
    .map((s) => ({ s, e: byId.get(s.exam_id) }))
    .filter((r): r is { s: Summary; e: NonNullable<typeof r.e> } => !!r.e)
    .sort((a, b) => b.s.files - a.s.files)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Previous year papers</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Question papers and answer keys published by the exam boards themselves. Every link opens the official copy —
            we check the boards&apos; websites every month for new ones.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rows.length === 0 ? (
          <p className="text-gray-500">No papers found on official websites yet.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {rows.map(({ s, e }) => (
              <li key={s.exam_id}>
                <Link href={`/exams/${e.slug}#papers`}
                  className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-indigo-300 hover:shadow transition">
                  <p className="font-semibold text-gray-900">{e.name}</p>
                  {e.conducting_body && <p className="text-xs text-gray-500 mt-0.5">{e.conducting_body}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {s.question_papers > 0 && (
                      <span className="inline-flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500" />{count(s.question_papers, 'question paper')}</span>
                    )}
                    {s.answer_keys > 0 && (
                      <span className="inline-flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-emerald-600" />{count(s.answer_keys, 'answer key')}</span>
                    )}
                    {s.files - s.question_papers - s.answer_keys > 0 && (
                      <span className="inline-flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-amber-600" />{count(s.files - s.question_papers - s.answer_keys, 'sample paper')}</span>
                    )}
                  </div>
                  {s.latest_year && (
                    <p className="text-xs text-gray-400 mt-2">
                      {s.earliest_year && s.earliest_year !== s.latest_year ? `${s.earliest_year}–${s.latest_year}` : s.latest_year}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-8">
          Some boards (for example UPSC and the NTA&apos;s NEET and JEE Main sites) don&apos;t let automated readers open their pages, so
          their papers can&apos;t be listed here — find them on the board&apos;s own website.
        </p>
      </div>
    </main>
  )
}
