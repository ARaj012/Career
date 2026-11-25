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
      {!isAdmin && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAdmin && <SiteFooter />}
      {!isAdmin && <ChatWidget />}
    </>
  )
}
