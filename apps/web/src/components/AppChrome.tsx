'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChatWidget from '@/components/ChatWidget'
import SiteFooter from '@/components/SiteFooter'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      {/* First thing a keyboard user reaches: jump past the navbar */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-700 focus:text-white focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      {!isAdmin && <Navbar />}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      {!isAdmin && <SiteFooter />}
      {!isAdmin && <ChatWidget />}
    </>
  )
}
