import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare careers | Snova',
  description: 'Compare careers side by side.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
