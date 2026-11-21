'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BellOff, BellRing } from 'lucide-react'

export default function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<'ask' | 'busy' | 'off' | 'on' | 'error'>('ask')
  const [error, setError] = useState('')

  async function send(resubscribe: boolean) {
    setState('busy')
    try {
      const res = await fetch('/api/alerts/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, resubscribe }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Something went wrong')
      setState(resubscribe ? 'on' : 'off')
    } catch (err) {
      setError((err as Error).message)
      setState('error')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
      {state === 'off' ? (
        <>
          <BellOff className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">Reminder emails are off</h1>
          <p className="text-sm text-gray-500 mt-2">You&apos;ll still see reminders in your notifications on the site.</p>
          <button type="button" onClick={() => send(true)} className="mt-5 text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Changed your mind? Turn them back on
          </button>
        </>
      ) : state === 'on' ? (
        <>
          <BellRing className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">Reminder emails are back on</h1>
          <Link href="/my-exams" className="inline-block mt-5 text-sm font-medium text-indigo-600 hover:text-indigo-800">Go to my exams →</Link>
        </>
      ) : (
        <>
          <BellOff className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">Stop exam reminder emails?</h1>
          <p className="text-sm text-gray-500 mt-2">
            We email you before registration opens and closes, on exam day and when results are due, for the exams you track.
          </p>
          {state === 'error' && <p className="text-sm text-red-600 mt-3">{error}</p>}
          {!token ? (
            <p className="text-sm text-red-600 mt-4">This link is missing its code. Sign in and turn reminders off on <Link href="/my-exams" className="underline">My exams</Link>.</p>
          ) : (
            <button type="button" disabled={state === 'busy'} onClick={() => send(false)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg">
              {state === 'busy' ? 'Saving…' : 'Yes, stop the emails'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
