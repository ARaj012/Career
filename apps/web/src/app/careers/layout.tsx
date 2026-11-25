import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers | Snova',
  description: 'Explore careers for Indian students — what each job involves, salaries, the exams and courses that lead to it, and where people work.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
