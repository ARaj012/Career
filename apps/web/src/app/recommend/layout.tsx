import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find my career | Snova',
  description: 'Answer a few questions about your subjects and interests and get career matches made for you.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
