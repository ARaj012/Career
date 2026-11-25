import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Colleges and universities | Snova',
  description: 'Compare Indian colleges by NIRF rank, fees, cutoffs, placements and scholarships.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
