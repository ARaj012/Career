import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | Snova',
  description: 'Snova plans for students.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
