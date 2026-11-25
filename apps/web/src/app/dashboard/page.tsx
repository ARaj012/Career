import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight, Award, BookOpen, Bookmark, Building2, CheckCircle2, Circle, Compass, FileText, History, Map as MapIcon, Target, TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BRAND_TAGLINE } from '@/lib/brand'
import UpcomingExams from '@/components/UpcomingExams'

const lakh = (n: number) => `₹${+(n / 100000).toFixed(1)}L`

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mine = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  const [
    { data: careers },
    { count: savedCareers },
    { count: savedColleges },
    { count: savedExams },
    { count: matchRuns },
    { data: subscription },
    { data: profile },
  ] = await Promise.all([
    supabase.from('careers').select('id, title, slug, category, avg_salary_min, avg_salary_max, demand_score').eq('is_trending', true).limit(6),
    mine('user_saved_careers'),
    mine('user_saved_colleges'),
    mine('user_saved_exams'),
    mine('user_recommendation_history'),
    supabase.from('user_subscriptions').select('plan_id, status').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'Student'

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

  const stats: { icon: LucideIcon; label: string; value: number; href: string; tint: string }[] = [
    { icon: Compass, label: 'Career matches run', value: matchRuns ?? 0, href: '/recommendation-history', tint: 'bg-indigo-50 text-indigo-600' },
    { icon: Bookmark, label: 'Saved careers', value: savedCareers ?? 0, href: '/saved/careers', tint: 'bg-pink-50 text-pink-600' },
    { icon: Building2, label: 'Saved colleges', value: savedColleges ?? 0, href: '/saved/colleges', tint: 'bg-sky-50 text-sky-600' },
    { icon: FileText, label: 'Saved exams', value: savedExams ?? 0, href: '/saved/exams', tint: 'bg-amber-50 text-amber-600' },
  ]

  const actions: { icon: LucideIcon; label: string; href: string }[] = [
    { icon: Compass, label: 'Find my career matches', href: '/recommend' },
    { icon: Target, label: 'My exams and reminders', href: '/my-exams' },
    { icon: Award, label: 'Scholarship matcher', href: '/scholarships/match' },
    { icon: TrendingUp, label: 'Fees vs placements', href: '/colleges/value' },
    { icon: FileText, label: 'Previous year papers', href: '/papers' },
    { icon: MapIcon, label: 'Career roadmaps', href: '/roadmaps' },
    { icon: History, label: 'Recommendation history', href: '/recommendation-history' },
    { icon: BookOpen, label: 'Blog', href: '/blog' },
  ]

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
            {subscription && (
              <div className="inline-flex items-center gap-2 self-start md:self-center bg-white/15 px-4 py-2 rounded-xl">
                <span className="text-sm font-medium capitalize">{subscription.plan_id} plan</span>
                {subscription.plan_id === 'free' && (
                  <Link href="/pricing" className="text-xs bg-white text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-50 transition">
                    Upgrade
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Your numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, href, tint }) => (
            <Link key={label} href={href} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Trending careers */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Trending careers</h2>
              <Link href="/careers" className="text-indigo-600 text-sm font-medium hover:text-indigo-800">View all</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careers?.map((career) => (
                <Link key={career.id} href={`/careers/${career.slug}`} className="group bg-white rounded-2xl p-5 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">{career.category}</span>
                    <span className="bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">Trending</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-3 group-hover:text-indigo-700">{career.title}</h3>
                  {(career.avg_salary_min || career.avg_salary_max) && (
                    <p className="text-emerald-600 text-sm font-medium mt-1">
                      {career.avg_salary_min && career.avg_salary_max
                        ? `${lakh(career.avg_salary_min)} – ${lakh(career.avg_salary_max)} a year`
                        : `${lakh(career.avg_salary_min || career.avg_salary_max)} a year`}
                    </p>
                  )}
                  {career.demand_score != null && (
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
              ))}
            </div>
          </div>

          {/* Sidebar */}
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
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                          : <Circle className="w-4 h-4 text-gray-300" aria-hidden="true" />}
                        <span className={item.done ? 'text-gray-400' : 'text-gray-700'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">A complete profile gives you better career matches and scholarship results.</p>
                  <Link href="/profile" className="block mt-4 text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                    Complete profile
                  </Link>
                </>
              )}
            </div>

            {/* Upcoming exams */}
            <UpcomingExams />

            {/* Shortcuts */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-3">Shortcuts</h2>
              <ul className="space-y-1">
                {actions.map(({ icon: Icon, label, href }) => (
                  <li key={href}>
                    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-700 transition">
                      <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
