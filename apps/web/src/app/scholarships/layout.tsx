import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scholarships | Snova',
  description: 'Government, merit and need-based scholarships for Indian students, with amounts, eligibility and official application links.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
