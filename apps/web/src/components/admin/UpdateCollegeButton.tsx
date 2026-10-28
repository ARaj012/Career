'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

/** Reads one college's official website now: courses, fees, placements, admission, NAAC/founded. */
export default function UpdateCollegeButton({ collegeId }: { collegeId: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const run = async () => {
    setBusy(true)
    setMessage('Reading the official website… this can take a minute or two.')
    const res = await fetch('/api/admin/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'college', collegeId }),
    }).catch(() => null)
    const json = res ? await res.json().catch(() => ({ error: `Server returned ${res.status}` })) : { error: 'Network error' }
    setBusy(false)
    if (json.error || json.quotaStop) setMessage(json.error || json.quotaStop)
    else {
      const s = json.stats
      const skipped = (json.log as string[]).filter((l) => l.includes('skipped')).join('; ')
      setMessage(`${s.auto_applied} values updated, ${s.pending} waiting in Admin → Automation${skipped ? `. ${skipped}` : ''}. Reload to see the changes.`)
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
      <button
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Update from official website
      </button>
      <p className="text-sm text-indigo-900">{message || 'Courses, fees, placements, admission process, NAAC grade and founding year.'}</p>
    </div>
  )
}
