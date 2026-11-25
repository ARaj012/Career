import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight, Award, Bookmark, Building2, CheckCircle2, Circle, Compass, FileText, History, Map as MapIcon, Target, TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BRAND_TAGLINE } from '@/lib/brand'
import UpcomingExams from '@/components/UpcomingExams'

const lakh = (n: number) => `₹${+(n / 100000).toFixed(1)}L`
const salary = (min?: number | null, max?: number | null) =>
  min && max ? `${lakh(min)} – ${lakh(max)} a year` : min || max ? `${lakh((min || max)!)} a year` : null

type CareerCard = {
  slug: string
  title: string
  category?: string | null
  avg_salary_min?: number | null
  avg_salary_max?: number | null
  demand_score?: number | null
  match_score?: number | null
}

/** One career tile: category, title, salary, and either the student's match % or the demand score */
function CareerTile({ career }: { career: CareerCard }) {
  const pay = salary(career.avg_salary_min, career.avg_salary_max)
  const match = career.match_score
  return (
    <Link href={`/careers/${career.slug}`} className="group bg-white rounded-2xl p-5 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        {career.category && <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">{career.category}</span>}
        {match != null && <span className="ml-auto bg-emerald-50 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-full tabular-nums">{match}% match</span>}
      </div>
      <h3 className="font-semibold text-gray-900 mt-3 group-hover:text-indigo-700">{career.title}</h3>
      {pay && <p className="text-emerald-700 text-sm font-medium mt-1">{pay}</p>}
      {match == null && career.demand_score != null && (
        <>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">Demand</span>
            <span className="text-indigo-600 font-semibold">{career.demand_score}/10</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(career.demand_score / 10) * 100}%` }} />
          </div>
        </>
      )}
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mine = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  const [
    { data: trending },
    { count: savedCareers },
    { count: savedColleges },
    { count: savedExams },
    { count: matchRuns },
    { data: lastRun },
    { data: subscription },
    { data: profile },
  ] = await Promise.all([
    supabase.from('careers').select('id, title, slug, category, avg_salary_min, avg_salary_max, demand_score').eq('is_trending', true).limit(6),
    mine('user_saved_careers'),
    mine('user_saved_colleges'),
    mine('user_saved_exams'),
    mine('user_recommendation_history'),
    supabase.from('user_recommendation_history').select('created_at, recommendations').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('user_subscriptions').select('plan_id, status').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'Student'

  // The student's own results from their latest career-match run
  const topMatches = ((lastRun?.recommendations ?? []) as CareerCard[]).filter((c) => c?.slug && c?.title).slice(0, 4)
  const lastRunDate = lastRun?.created_at
    ? new Date(lastRun.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : null
  // With personal matches on show, four trending careers are enough
  const trendingShown = (trending ?? []).slice(0, topMatches.length ? 4 : 6)

  const sections = [
    { label: 'Basic info', done: true },
    { label: 'Education', done: !!profile?.class_level },
    { label: 'Stream', done: !!profile?.stream },
    { label: 'Board', done: !!profile?.board },
    { label: 'State', done: !!profile?.state },
    { label: 'Subjects', done: (profile?.subjects?.length || 0) > 0 },
    { label: 'Target exams', done: (profile?.target_exams?.length || 0) > 0 },
    { label: 'Career goal', done: !!profile?.career_goal },
  ]
  const completedCount = sections.filter((s) => s.done).length
  const completionPct = Math.round((completedCount / sections.length) * 100)

  // Each count opens the saved list; at zero it points to where to start instead
  const stats: { icon: LucideIcon; label: string; value: number; href: string; empty: { label: string; href: string }; tint: string }[] = [
    { icon: Compass, label: 'Career matches run', value: matchRuns ?? 0, href: '/recommendation-history', empty: { label: 'Find my matches', href: '/recommend' }, tint: 'bg-indigo-50 text-indigo-600' },
    { icon: Bookmark, label: 'Saved careers', value: savedCareers ?? 0, href: '/saved/careers', empty: { label: 'Browse careers', href: '/careers' }, tint: 'bg-pink-50 text-pink-700' },
    { icon: Building2, label: 'Saved colleges', value: savedColleges ?? 0, href: '/saved/colleges', empty: { label: 'Browse colleges', href: '/colleges' }, tint: 'bg-sky-50 text-sky-700' },
    { icon: FileText, label: 'Saved exams', value: savedExams ?? 0, href: '/saved/exams', empty: { label: 'Browse exams', href: '/exams' }, tint: 'bg-amber-50 text-amber-700' },
  ]

  // Tools not already in the navbar or the buttons above
  const shortcuts: { icon: LucideIcon; label: string; note: string; href: string }[] = [
    { icon: Target, label: 'My exams', note: 'Dates and reminders', href: '/my-exams' },
    { icon: Award, label: 'Scholarship matcher', note: 'See what you qualify for', href: '/scholarships/match' },
    { icon: TrendingUp, label: 'Fees vs placements', note: 'Is a college worth it?', href: '/colleges/value' },
    { icon: FileText, label: 'Previous year papers', note: 'Official papers and keys', href: '/papers' },
    { icon: MapIcon, label: 'Career roadmaps', note: 'Step-by-step paths', href: '/roadmaps' },
    { icon: History, label: 'Past career matches', note: 'Every run you saved', href: '/recommendation-history' },
  ]

  const plan = subscription?.plan_id ? subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Welcome */}
        <div className="bg-indigo-600 rounded-3xl p-6 sm:p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
              <p className="text-indigo-100 mt-1">{BRAND_TAGLINE}</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link href="/recommend" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition">
                  Find my career matches <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link href="/careers" className="inline-flex items-center justify-center bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-400 transition border border-indigo-400">
                  Browse careers
                </Link>
              </div>
            </div>
            {plan && (subscription?.plan_id === 'free' ? (
              <div className="inline-flex items-center gap-2 self-start md:self-center bg-white/15 px-4 py-2 rounded-xl">
                <span className="text-sm font-medium">Free plan</span>
                <Link href="/pricing" className="text-xs bg-white text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-50 transition">
                  Upgrade
                </Link>
              </div>
            ) : (
              <Link href="/subscription" className="inline-flex items-center gap-2 self-start md:self-center bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition">
                <span className="text-sm font-medium">{plan} plan</span>
                <span className="text-xs text-indigo-100">Manage</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {/* Your numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, href, empty, tint }) => (
            <Link key={label} href={value ? href : empty.href} className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
              {!value && (
                <p className="text-sm font-medium text-indigo-600 mt-2 inline-flex items-center gap-1 group-hover:text-indigo-800">
                  {empty.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </p>
              )}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-10">

            {topMatches.length > 0 && (
              <section aria-labelledby="matches-heading">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h2 id="matches-heading" className="text-xl font-bold text-gray-900">Your top matches</h2>
                    {lastRunDate && <p className="text-sm text-gray-500 mt-0.5">From your career match on {lastRunDate}</p>}
                  </div>
                  <Link href="/recommend" className="shrink-0 text-indigo-600 text-sm font-medium hover:text-indigo-800">Run again</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topMatches.map((c) => <CareerTile key={c.slug} career={c} />)}
                </div>
              </section>
            )}

            <section aria-labelledby="trending-heading">
              <div className="flex items-center justify-between mb-4">
                <h2 id="trending-heading" className="text-xl font-bold text-gray-900">Trending careers</h2>
                <Link href="/careers" className="text-indigo-600 text-sm font-medium hover:text-indigo-800">View all</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendingShown.map((c) => <CareerTile key={c.slug} career={{ ...c, match_score: null }} />)}
              </div>
            </section>

            <section aria-labelledby="shortcuts-heading">
              <h2 id="shortcuts-heading" className="text-xl font-bold text-gray-900 mb-4">More tools</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shortcuts.map(({ icon: Icon, label, note, href }) => (
                  <Link key={href} href={href} className="group bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition">
                    <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                    <p className="text-sm font-semibold text-gray-900 mt-2 group-hover:text-indigo-700">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{note}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (stretches to the main column's height, so the exams card below can stay in view) */}
          <div className="space-y-6">

            {/* Profile completion */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-2">Profile completion</h2>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-500">{completedCount} of {sections.length} done</span>
                <span className="text-indigo-600 font-semibold">{completionPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${completionPct}%` }} />
              </div>
              {completionPct < 100 && (
                <>
                  <ul className="mt-4 space-y-2">
                    {sections.map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-sm">
                        {item.done
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                          : <Circle className="w-4 h-4 text-gray-300" aria-hidden="true" />}
                        <span className={item.done ? 'text-gray-500' : 'text-gray-700'}>{item.label}</span>
                        <span className="sr-only">{item.done ? '(done)' : '(not done)'}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">A complete profile gives you better career matches and scholarship results.</p>
                  <Link href="/profile" className="block mt-4 text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                    Complete profile
                  </Link>
                </>
              )}
              {completionPct === 100 && (
                <p className="mt-3 text-sm text-gray-600">
                  All set: your matches use your full profile.{' '}
                  <Link href="/profile" className="text-indigo-600 font-medium hover:text-indigo-800">Edit profile</Link>
                </p>
              )}
            </div>

            {/* Upcoming exams: sticks below the navbar while the longer main column scrolls past */}
            <div className="lg:sticky lg:top-24">
              <UpcomingExams />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
