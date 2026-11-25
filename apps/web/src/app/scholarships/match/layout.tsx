import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scholarship matcher | Snova',
  description: "Answer a few questions and see which scholarships you qualify for, checked against each scheme's published rules.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
