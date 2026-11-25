import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in | Snova',
  description: 'Sign in to Snova to save careers, colleges and exams and get exam reminders.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
