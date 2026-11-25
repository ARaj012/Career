import type { Metadata } from 'next'
import UnsubscribeForm from './UnsubscribeForm'

export const metadata: Metadata = {
  title: 'Exam reminder emails | Snova',
  robots: { index: false },
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-12">
      <UnsubscribeForm token={token ?? ''} />
    </div>
  )
}
