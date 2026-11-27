'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Building2, FileText, Bell, Users,
  GraduationCap, LogOut, ArrowLeft, History, Settings, BookOpen, Map, DollarSign, Crown, RefreshCw, Menu, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/automation', label: 'Automation', icon: RefreshCw },
  { href: '/admin/alerts', label: 'Data Alerts', icon: Bell },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/careers', label: 'Careers', icon: Briefcase },
  { href: '/admin/colleges', label: 'Colleges', icon: Building2 },
  { href: '/admin/exams', label: 'Exams', icon: FileText },
  { href: '/admin/skills', label: 'Skills', icon: BookOpen },
  { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/admin/roadmaps', label: 'Roadmaps', icon: Map },
  { href: '/admin/scholarships', label: 'Scholarships', icon: DollarSign },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Crown },
  { href: '/admin/audit', label: 'Audit Logs', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
        <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-white leading-tight">Snova</p>
        <p className="text-xs text-slate-400">Admin console</p>
      </div>
    </div>
  )
}

/**
 * Admin navigation. On large screens it is a fixed column; on phones and tablets it becomes a
 * top bar with a menu button that slides the same links in from the left.
 */
export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)

  // Close the menu after navigating to another page (adjusting state during render, not in an effect)
  if (open && pathname !== openedAt) setOpen(false)

  // Escape closes the menu; the page behind doesn't scroll while it's open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Phone / tablet top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-slate-950 px-4 py-3">
        <Brand />
        <button
          onClick={() => { setOpenedAt(pathname); setOpen(true) }}
          className="p-2 rounded-lg text-slate-200 hover:bg-slate-800"
          aria-label="Open admin menu"
          aria-expanded={open}
          aria-controls="admin-nav"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        id="admin-nav"
        className={`w-64 lg:w-60 shrink-0 bg-slate-950 text-slate-200 flex flex-col
          fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-200 motion-reduce:transition-none
          lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <Brand />
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-slate-800" aria-label="Close admin menu">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Student site
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
