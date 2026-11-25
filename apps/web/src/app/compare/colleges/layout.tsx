import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare colleges | Snova',
  description: 'Compare colleges side by side — fees, ranks, cutoffs and placements.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
