'use client'

import { useEffect, useRef, useState } from 'react'

export type NavSection = { id: string; label: string }

/**
 * "On this page": a sticky row of section links under the navbar. Pages pass every section
 * they might have; only those actually on the page are shown, and the one being read is
 * highlighted. Each section element needs the matching id (and scroll-mt-32 so the bars
 * don't cover its heading).
 */
export default function SectionNav({ sections, className = '' }: { sections: NavSection[]; className?: string }) {
  const [present, setPresent] = useState<NavSection[]>([])
  const [active, setActive] = useState<string | null>(null)
  const row = useRef<HTMLDivElement>(null)

  // Which sections this page really has: on the page and not empty (some depend on the data).
  // Two entries with the same label (say, cutoffs in the main column and the sidebar) show once.
  useEffect(() => {
    const check = () => {
      const seen = new Set<string>()
      const found = sections.filter((s) => {
        const el = document.getElementById(s.id)
        if (!el || el.offsetHeight === 0 || seen.has(s.label)) return false
        seen.add(s.label)
        return true
      })
      setPresent((old) => (old.map((s) => s.id).join() === found.map((s) => s.id).join() ? old : found))
    }
    // a timeout, not requestAnimationFrame, so it also runs in tabs opened in the background;
    // checked again on resize, since some sections only show at some widths
    const timer = setTimeout(check, 0)
    window.addEventListener('resize', check)
    return () => { clearTimeout(timer); window.removeEventListener('resize', check) }
  }, [sections])

  // Highlight the section being read: of those whose top has passed the bars, the most recent
  // (works for two-column pages too, where list order and page order differ)
  useEffect(() => {
    if (present.length === 0) return
    const onScroll = () => {
      let current = present[0].id
      let best = -Infinity
      for (const s of present) {
        const top = document.getElementById(s.id)?.getBoundingClientRect().top
        if (top != null && top <= 150 && top > best) { best = top; current = s.id }
      }
      // At the very bottom the last sections can't reach the top, so pick the lowest one on screen
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        best = -Infinity
        for (const s of present) {
          const top = document.getElementById(s.id)?.getBoundingClientRect().top
          if (top != null && top < window.innerHeight && top > best) { best = top; current = s.id }
        }
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [present])

  // Keep the highlighted chip visible in the row (phones)
  useEffect(() => {
    const box = row.current
    const chip = box?.querySelector<HTMLElement>(`[data-id="${active}"]`)
    if (box && chip) box.scrollTo({ left: chip.offsetLeft - box.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  if (present.length < 3) return null

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
    setActive(id)
  }

  return (
    <nav aria-label="On this page" className={`sticky top-16 z-30 ${className}`}>
      <div ref={row} className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {present.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-id={s.id}
            onClick={(e) => go(e, s.id)}
            aria-current={active === s.id ? 'true' : undefined}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              active === s.id ? 'bg-indigo-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
