'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'

/** On/off switch for exam reminder emails, with where they go and when the last one went. */
export default function EmailAlertsToggle() {
  const [on, setOn] = useState<boolean | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [last, setLast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/alerts/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setOn(d.emailAlerts)
        setEmail(d.email)
        setLast(d.lastEmailAt)
      })
      .catch(() => {})
  }, [])

  async function toggle() {
    if (on === null) return
    const next = !on
    setSaving(true)
    setError('')
    setOn(next)
    try {
      const res = await fetch('/api/alerts/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ emailAlerts: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setOn(!next)
      setError('Could not save — try again')
    } finally {
      setSaving(false)
    }
  }

  if (on === null) return null

  return (
    <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Email reminders</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Before registration opens and closes, on exam day and when results are due — for every exam you track.
            {email && <> Sent to <span className="text-gray-700">{email}</span>.</>}
          </p>
          {last && <p className="text-[11px] text-gray-500 mt-1">Last email {new Date(last).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
          {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
        </div>
        <button type="button" role="switch" aria-checked={on} aria-label="Email reminders" onClick={toggle} disabled={saving}
          className={`relative shrink-0 w-11 h-6 rounded-full transition ${on ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-60`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </button>
      </div>
    </div>
  )
}
