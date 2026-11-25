import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrance exams | Snova',
  description: 'Entrance and recruitment exams with dates, eligibility, syllabus, cutoffs, previous papers and official links.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
