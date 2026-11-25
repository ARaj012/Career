'use client'

import { useState } from 'react'
import { Calendar, Target, CheckCircle, AlertCircle, Clock, RotateCcw } from 'lucide-react'

interface ExamRoadmapProps {
  examId: string
  examTitle: string
  examDate: string | null
}

type Phase = { name: string; duration: string; tasks: string[] }
type Roadmap = { daysRemaining: number; phases: Phase[]; dailyHours: string; keyFocus: string }

export default function ExamRoadmap({ examId, examTitle, examDate }: ExamRoadmapProps) {
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Days until the exam (null while the date is not announced); the clock is read once, when shown
  const [now] = useState(() => Date.now())
  const daysRemaining = examDate
    ? Math.ceil((new Date(examDate).getTime() - now) / (1000 * 60 * 60 * 24))
    : null
  const shortOnTime = daysRemaining !== null && daysRemaining < 90

  const generateRoadmap = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, examTitle, examDate }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok && data?.success) setRoadmap(data.roadmap)
      else if (response.status === 401) setError('Please sign in again to make your roadmap.')
      else setError(data?.error || 'Could not make the roadmap. Please try again.')
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const errorNote = error && (
    <p role="alert" className="mt-3 text-sm text-red-700 flex items-center gap-1.5">
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
    </p>
  )

  // The plan, once made (checked first so it shows whatever the time left)
  if (roadmap) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6" aria-live="polite">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-700" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900">Your {examTitle} roadmap</h3>
          </div>
          <button
            onClick={() => setRoadmap(null)}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Start over
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" aria-hidden="true" /> {roadmap.daysRemaining} days left</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" aria-hidden="true" /> {roadmap.dailyHours} a day</span>
          <span>Focus: {roadmap.keyFocus}</span>
        </p>

        <ol className="space-y-5">
          {roadmap.phases.map((phase, index) => (
            <li key={phase.name} className="border-l-2 border-indigo-200 pl-4">
              <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
                <span className="text-xs font-semibold text-indigo-700">Phase {index + 1}</span>
                <span className="font-medium text-gray-900">{phase.name}</span>
                <span className="text-sm text-gray-500">{phase.duration}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {phase.tasks.map((task) => (
                  <li key={task} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-500 mt-5">
          A general plan based on the time left. Check the official syllabus and exam pattern for {examTitle} too.
        </p>
      </div>
    )
  }

  if (shortOnTime) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">Limited time for preparation</h3>
            <p className="text-sm text-red-700 mb-3">
              {daysRemaining! > 0
                ? `With only ${daysRemaining} days remaining, you need an intensive plan: high-weightage topics, previous papers and mock tests.`
                : 'This exam date has passed or is today. You can still make a last-minute revision plan.'}
            </p>
            <button
              onClick={generateRoadmap}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 transition disabled:opacity-50"
            >
              {loading ? 'Making your roadmap…' : 'Generate intensive roadmap'}
            </button>
            {errorNote}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-indigo-900 mb-2">Study roadmap</h3>
          <p className="text-sm text-indigo-700 mb-3">
            {daysRemaining !== null
              ? `Get a study plan for your ${daysRemaining} days of preparation, split into phases with clear targets.`
              : 'The exam date isn’t announced yet. Get a study plan for about three months of preparation.'}
          </p>
          <button
            onClick={generateRoadmap}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Making your roadmap…' : 'Generate roadmap'}
          </button>
          {errorNote}
        </div>
      </div>
    </div>
  )
}
