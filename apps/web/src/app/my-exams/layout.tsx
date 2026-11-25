import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My exams | Snova',
  // A signed-in page: keep it out of search results
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
