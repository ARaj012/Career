import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { examTitle, examDate } = await req.json()

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Days until the exam; about three months when the date isn't announced
    const daysRemaining = examDate
      ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 90

    return NextResponse.json({ success: true, roadmap: buildRoadmap(String(examTitle || 'your exam'), daysRemaining) })
  } catch (error) {
    console.error('Error generating roadmap:', error)
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 })
  }
}

type Phase = { name: string; duration: string; tasks: string[] }

/** Split the days left into phases by share, e.g. [0.4, 0.4, 0.2] → "Days 1–29", "Days 30–58", "Days 59–73" */
function ranges(days: number, shares: number[]): string[] {
  const out: string[] = []
  let start = 1
  shares.forEach((share, i) => {
    const end = i === shares.length - 1 ? days : Math.max(start, start + Math.round(days * share) - 1)
    out.push(start === end ? `Day ${start}` : `Days ${start}–${end}`)
    start = end + 1
  })
  return out
}

/**
 * A study plan sized to the time left. It is a general plan by phases (not tied to one exam's
 * syllabus), so the phase lengths always match the real number of days.
 */
function buildRoadmap(examTitle: string, daysRemaining: number) {
  const days = Math.max(daysRemaining, 1)
  let phases: Phase[]

  if (days >= 180) {
    const [a, b, c] = ranges(days, [0.35, 0.35, 0.3])
    phases = [
      { name: 'Foundation', duration: a, tasks: [
        `Read the official ${examTitle} syllabus and exam pattern, and list every topic`,
        'Build strong basics in each subject from standard textbooks',
        'Set a fixed daily timetable and stick to it',
        'Collect previous year papers to see which topics come up most',
      ] },
      { name: 'Deep study', duration: b, tasks: [
        'Finish every topic, one subject at a time',
        'Solve topic-wise questions after each chapter',
        'Make short notes and formula sheets for revision',
        'Take a sectional test every week',
      ] },
      { name: 'Practice and revision', duration: c, tasks: [
        'Take a full-length mock test every week, then every few days',
        'Review each mock: note mistakes and revise those topics',
        'Solve previous year papers under exam timing',
        'Revise notes and formula sheets regularly',
      ] },
    ]
  } else if (days >= 90) {
    const [a, b, c] = ranges(days, [0.35, 0.35, 0.3])
    phases = [
      { name: 'Quick foundation', duration: a, tasks: [
        `Go through the official ${examTitle} syllabus and mark high-weightage topics`,
        'Study high-weightage topics first',
        'Make condensed notes as you go',
        'Practise questions every day',
      ] },
      { name: 'Topic mastery', duration: b, tasks: [
        'Cover the remaining important topics',
        'Solve previous year questions topic by topic',
        'Take topic-wise tests and fix weak areas',
        'Keep a regular revision slot each week',
      ] },
      { name: 'Final sprint', duration: c, tasks: [
        'Take full-length mock tests every few days',
        'Work on speed and accuracy',
        'Revise key concepts and formulas',
        'Plan your exam-day strategy and time per section',
      ] },
    ]
  } else if (days > 14) {
    const [a, b, c] = ranges(days, [0.4, 0.4, 0.2])
    phases = [
      { name: 'High-weightage topics', duration: a, tasks: [
        'List the topics that carry the most marks in previous papers',
        'Study those topics first; skip low-value ones for now',
        'Solve previous year questions on each topic right after studying it',
      ] },
      { name: 'Mock tests and weak areas', duration: b, tasks: [
        'Take a full-length mock test every 2–3 days under exam timing',
        'After each mock, revise the topics where you lost marks',
        'Keep practising previous year papers',
      ] },
      { name: 'Final revision', duration: c, tasks: [
        'Revise only from your own notes and formula sheets',
        'Take one or two last mocks to keep your timing sharp',
        'Sleep well and keep the last day light',
      ] },
    ]
  } else {
    phases = [
      { name: 'Final revision', duration: days === 1 ? 'Today' : `All ${days} days`, tasks: [
        'Revise formulas, key facts and your short notes',
        'Solve one previous year paper under exam timing, if time allows',
        'Don’t start new topics now; strengthen what you know',
        'Check your admit card, exam centre and documents',
        'Sleep well before the exam',
      ] },
    ]
  }

  return {
    examTitle,
    daysRemaining: days,
    phases,
    dailyHours: days >= 90 ? '6–8 hours' : '7–9 hours, with breaks',
    keyFocus: days >= 90 ? 'Cover the full syllabus' : 'High-weightage topics and practice',
  }
}
