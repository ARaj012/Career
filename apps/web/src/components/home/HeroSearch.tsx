'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Briefcase, Building2, FileText, Loader2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Kind = 'career' | 'college' | 'exam' | 'scholarship'
type Hit = { kind: Kind; title: string; sub: string | null; href: string }

const KIND: Record<Kind, { label: string; icon: typeof Search }> = {
  career: { label: 'Career', icon: Briefcase },
  college: { label: 'College', icon: Building2 },
  exam: { label: 'Exam', icon: FileText },
  scholarship: { label: 'Scholarship', icon: Award },
}

/** One box for the whole site: careers, colleges, exams and scholarships as you type */
export default function HeroSearch() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = q.trim().replace(/[%_,()]/g, ' ').trim()
    if (term.length < 2) return
    let stale = false
    const t = setTimeout(async () => {
      setLoading(true)
      const like = `%${term}%`
      // Names are stored in full ("Indian Institute of Technology Bombay"), so the short web name
      // (iit-bombay) is searched too — that is how most students type it
      const slugLike = `%${term.toLowerCase().replace(/\s+/g, '-')}%`
      const either = (col: string) => `${col}.ilike.${like},slug.ilike.${slugLike}`
      const [careers, colleges, exams, scholarships] = await Promise.all([
        supabase.from('careers').select('title, slug, category').or(either('title')).limit(8),
        supabase.from('colleges').select('name, slug, city, state').or(either('name')).order('nirf_rank', { ascending: true, nullsFirst: false }).limit(12),
        supabase.from('exams').select('name, slug, conducting_body').or(either('name')).limit(8),
        supabase.from('scholarships').select('name, slug, provider').eq('is_active', true).or(either('name')).limit(6),
      ])
      if (stale) return
      // Whole-word and starts-with matches first ("iit" → IIT Bombay before IIIT Delhi or KIIT)
      const word = new RegExp(`(^|[^a-z0-9])${term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s-]+')}($|[^a-z0-9])`)
      const score = (title: string, slug: string) => {
        const t = title.toLowerCase(), s = slug.toLowerCase()
        if (word.test(s) || word.test(t)) return t.startsWith(term.toLowerCase()) || s.startsWith(term.toLowerCase().replace(/\s+/g, '-')) ? 0 : 1
        return 2
      }
      const best = <T,>(rows: T[] | null, title: (r: T) => string, slug: (r: T) => string, n: number, hit: (r: T) => Hit) => {
        const ranked = (rows ?? []).map((r, i) => ({ r, i, s: score(title(r), slug(r)) })).sort((a, b) => a.s - b.s || a.i - b.i).slice(0, n)
        return { top: ranked[0]?.s ?? 9, hits: ranked.map((x) => hit(x.r)) }
      }
      const groups = [
        best(exams.data, (e) => e.name, (e) => e.slug, 4, (e) => ({ kind: 'exam', title: e.name, sub: e.conducting_body, href: `/exams/${e.slug}` })),
        best(colleges.data, (c) => c.name, (c) => c.slug, 4, (c) => ({ kind: 'college', title: c.name, sub: [c.city, c.state].filter(Boolean).join(', ') || null, href: `/colleges/${c.slug}` })),
        best(careers.data, (c) => c.title, (c) => c.slug, 4, (c) => ({ kind: 'career', title: c.title, sub: c.category, href: `/careers/${c.slug}` })),
        best(scholarships.data, (s) => s.name, (s) => s.slug, 3, (s) => ({ kind: 'scholarship', title: s.name, sub: s.provider, href: `/scholarships/${s.slug}` })),
      ]
      // The group with the strongest match leads (stable, so exams stay first on a tie)
      setHits(groups.map((g, i) => ({ ...g, i })).sort((a, b) => a.top - b.top || a.i - b.i).flatMap((g) => g.hits))
      setActive(0)
      setLoading(false)
      setOpen(true)
    }, 200)
    return () => { stale = true; clearTimeout(t) }
  }, [q, supabase])

  // Close when clicking anywhere else
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const short = q.trim().length < 2
  const shown = short ? [] : hits
  const go = (hit: Hit | undefined) => { if (hit) { setOpen(false); router.push(hit.href) } }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, shown.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(shown[active]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={box} className="relative w-full max-w-2xl mx-auto text-left">
      <label htmlFor="site-search" className="sr-only">Search careers, colleges, exams and scholarships</label>
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 sm:px-5 h-14 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition">
        <Search className="w-5 h-5 text-gray-500 shrink-0" aria-hidden="true" />
        <input
          id="site-search"
          type="search"
          role="combobox"
          aria-expanded={open && !short}
          aria-controls="site-search-results"
          aria-activedescendant={open && shown[active] ? `hit-${active}` : undefined}
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search a career, college, exam or scholarship"
          className="flex-1 min-w-0 bg-transparent outline-none text-base text-gray-900 placeholder:text-gray-500"
        />
        {loading && <Loader2 className="w-4 h-4 text-gray-500 animate-spin shrink-0" aria-hidden="true" />}
      </div>

      {open && !short && !loading && (
        <ul id="site-search-results" role="listbox" className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {shown.length === 0 ? (
            <li className="px-5 py-4 text-sm text-gray-500">No matches for “{q.trim()}”. Try a shorter word, like “IIT” or “JEE”.</li>
          ) : shown.map((hit, i) => {
            const { icon: Icon, label } = KIND[hit.kind]
            return (
              <li
                key={hit.href}
                id={`hit-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); go(hit) }}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3 cursor-pointer ${i === active ? 'bg-indigo-50' : ''}`}
              >
                <span className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900 truncate">{hit.title}</span>
                  {hit.sub && <span className="block text-xs text-gray-500 truncate">{hit.sub}</span>}
                </span>
                <span className="text-xs text-gray-500 shrink-0">{label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
