import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Snova',
  description: 'Exam guides, career tips and education news for Indian students.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
