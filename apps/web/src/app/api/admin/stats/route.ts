import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getFreshnessAlerts } from '@/lib/admin-freshness'

export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminSupabaseClient()

    // Health: how long one small database query takes, measured now
    const t0 = Date.now()
    const ping = await supabase.from('careers').select('id', { count: 'exact', head: true })
    const dbMs = Date.now() - t0

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const added = (table: string, key = 'id') =>
      supabase.from(table).select(key, { count: 'exact', head: true }).gte('created_at', since30)

    const [lastRun, reviewQueue, newCareers, newScholarships, newPosts, newSignups] = await Promise.all([
      supabase.from('automation_runs').select('started_at, finished_at, status, errors').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('automation_proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      added('careers'),
      added('scholarships'),
      added('blog_posts'),
      added('user_accounts', 'user_id'),
    ])

    const [
      careers,
      colleges,
      exams,
      profiles,
      userAccounts,
      alerts,
      auditCount,
      scholarships,
      blogPosts,
    ] = await Promise.all([
      supabase.from('careers').select('id', { count: 'exact', head: true }),
      supabase.from('colleges').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_accounts').select('user_id', { count: 'exact', head: true }),
      getFreshnessAlerts(),
      supabase.from('admin_audit_logs').select('id', { count: 'exact', head: true }),
      supabase.from('scholarships').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    ])

    // Get active users count
    const { count: activeUsersCount } = await supabase
      .from('user_accounts')
      .select('user_id', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      counts: {
        careers: careers.count ?? 0,
        colleges: colleges.count ?? 0,
        exams: exams.count ?? 0,
        students: profiles.count ?? 0,
        userAccounts: userAccounts.count ?? 0,
        activeUsers: activeUsersCount ?? 0,
        inactiveUsers: (userAccounts.count ?? 0) - (activeUsersCount ?? 0),
        scholarships: scholarships.count ?? 0,
        blogPosts: blogPosts.count ?? 0,
      },
      alerts: alerts.slice(0, 12),
      alertCount: alerts.length,
      auditCount: auditCount ?? 0,
      // Added in the last 30 days (only tables that record when a row was added)
      added30: {
        careers: newCareers.count ?? 0,
        scholarships: newScholarships.count ?? 0,
        blogPosts: newPosts.count ?? 0,
        signups: newSignups.count ?? 0,
      },
      health: {
        database: { ok: !ping.error, ms: dbMs, error: ping.error?.message ?? null },
        automation: lastRun.data
          ? {
              startedAt: lastRun.data.started_at,
              finishedAt: lastRun.data.finished_at,
              status: lastRun.data.status,
              failedSources: Array.isArray(lastRun.data.errors) ? lastRun.data.errors.length : 0,
            }
          : null,
        reviewQueue: reviewQueue.count ?? 0,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
