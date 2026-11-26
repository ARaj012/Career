'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CheckCircle2, XCircle, Calendar, Crown, Sparkles, Star, TrendingUp, X, CreditCard, AlertCircle } from 'lucide-react'

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  billing_cycle: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  user_email: string
  user_name: string
}

interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
}

interface Payment {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: string
  payment_method: string | null
  razorpay_payment_id: string | null
  metadata: { plan_id?: string; billing_cycle?: string } | null
  created_at: string
}

const day = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'
const rupees = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

const PLAN_STYLE: Record<string, { icon: typeof Star; tint: string }> = {
  free: { icon: Sparkles, tint: 'text-gray-700 bg-gray-100' },
  premium: { icon: Crown, tint: 'text-indigo-700 bg-indigo-100' },
  pro: { icon: Star, tint: 'text-amber-700 bg-amber-100' },
}
const STATUS_STYLE: Record<string, string> = {
  active: 'text-green-800 bg-green-50',
  cancelled: 'text-red-700 bg-red-50',
  expired: 'text-gray-700 bg-gray-100',
  past_due: 'text-amber-800 bg-amber-50',
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [selected, setSelected] = useState<Subscription | null>(null)

  // Every student's subscription comes from the admin API: with the browser client an
  // admin would only see their own row (students can read only their own subscription)
  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || 'Could not load subscriptions')
        setSubscriptions(json.subscriptions)
        setPlans(json.plans)
        setPayments(json.payments)
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const planById = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans])

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q || sub.user_email?.toLowerCase().includes(q) || sub.user_name?.toLowerCase().includes(q)
    return matchesSearch && (statusFilter === 'all' || sub.status === statusFilter) && (planFilter === 'all' || sub.plan_id === planFilter)
  })

  const active = subscriptions.filter((s) => s.status === 'active')
  const stats = {
    total: subscriptions.length,
    active: active.length,
    paid: active.filter((s) => s.plan_id !== 'free').length,
    // What active paid plans are worth a month at today's list prices (yearly plans spread over 12 months)
    monthlyValue: active.reduce((sum, s) => {
      const plan = planById.get(s.plan_id)
      if (!plan) return sum
      return sum + (s.billing_cycle === 'yearly' ? Number(plan.price_yearly) / 12 : Number(plan.price_monthly))
    }, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading subscriptions">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const cards = [
    { icon: TrendingUp, tint: 'bg-indigo-100 text-indigo-700', value: stats.total, label: 'Total subscriptions' },
    { icon: CheckCircle2, tint: 'bg-green-100 text-green-700', value: stats.active, label: 'Active subscriptions' },
    { icon: Crown, tint: 'bg-purple-100 text-purple-700', value: stats.paid, label: 'Active paid plans' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription management</h1>
      <p className="text-sm text-gray-500 mb-6">Every student&apos;s plan, billing period and payments.</p>

      {loadError && (
        <p role="alert" className="mb-6 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {loadError}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ icon: Icon, tint, value, label }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}><Icon className="w-5 h-5" aria-hidden="true" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold" aria-hidden="true">₹</div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{rupees(Math.round(stats.monthlyValue))}</p>
            <p className="text-xs text-gray-500">A month, at list prices</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search by email or name"
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="past_due">Past due</option>
          </select>
          <select aria-label="Filter by plan" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">All plans</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Student</th>
              <th scope="col" className="px-4 py-3 font-medium">Plan</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Billing</th>
              <th scope="col" className="px-4 py-3 font-medium">Current period ends</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No subscriptions found</td>
              </tr>
            ) : filteredSubscriptions.map((sub) => {
              const style = PLAN_STYLE[sub.plan_id] ?? PLAN_STYLE.free
              const PlanIcon = style.icon
              return (
                <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{sub.user_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{sub.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.tint}`}><PlanIcon className="w-4 h-4" aria-hidden="true" /></div>
                      <span className="font-medium text-gray-900">{planById.get(sub.plan_id)?.name ?? sub.plan_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLE[sub.status] ?? STATUS_STYLE.expired}`}>
                      {sub.status === 'active' ? <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> : <XCircle className="w-3 h-3" aria-hidden="true" />}
                      {sub.status.replace('_', ' ')}
                    </span>
                    {sub.cancel_at_period_end && <span className="block text-xs text-amber-800 mt-1">Cancels at period end</span>}
                  </td>
                  <td className="px-4 py-3 capitalize">{sub.billing_cycle}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" aria-hidden="true" /> {day(sub.current_period_end)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(sub)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      aria-label={`View details for ${sub.user_name || sub.user_email || 'this subscription'}`}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <SubscriptionDetails
          sub={selected}
          plan={planById.get(selected.plan_id)}
          payments={payments.filter((p) => p.user_id === selected.user_id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

/** Side panel with one student's subscription and payment history */
function SubscriptionDetails({ sub, plan, payments, onClose }: {
  sub: Subscription
  plan: Plan | undefined
  payments: Payment[]
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const price = plan ? (sub.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly) : null
  const rows: [string, React.ReactNode][] = [
    ['Plan', <>{plan?.name ?? sub.plan_id}{price != null && Number(price) > 0 && <span className="text-gray-500"> · {rupees(price)} a {sub.billing_cycle === 'yearly' ? 'year' : 'month'} (list price)</span>}</>],
    ['Status', <span key="s" className="capitalize">{sub.status.replace('_', ' ')}{sub.cancel_at_period_end ? ' · cancels at period end' : ''}</span>],
    ['Billing', <span key="b" className="capitalize">{sub.billing_cycle}</span>],
    ['Current period', `${day(sub.current_period_start)} – ${day(sub.current_period_end)}`],
    ['Subscribed since', day(sub.created_at)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="sub-details-title" className="relative w-full max-w-md h-full bg-white shadow-xl overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="min-w-0">
            <h2 id="sub-details-title" className="text-lg font-semibold text-gray-900">{sub.user_name || 'Unknown student'}</h2>
            <p className="text-sm text-gray-500 truncate">{sub.user_email}</p>
          </div>
          <button ref={closeRef} onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="Close details">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="p-5 grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="px-5 pb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" aria-hidden="true" /> Payments ({payments.length})
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments recorded.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {payments.map((p) => {
                const test = p.payment_method === 'mock' || p.razorpay_payment_id?.startsWith('pay_mock')
                return (
                  <li key={p.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 tabular-nums">{rupees(p.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {day(p.created_at)}
                        {p.metadata?.plan_id && <> · <span className="capitalize">{p.metadata.plan_id}</span></>}
                        {p.metadata?.billing_cycle && <> · {p.metadata.billing_cycle}</>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${p.status === 'completed' ? 'text-green-800 bg-green-50' : p.status === 'failed' ? 'text-red-700 bg-red-50' : 'text-amber-800 bg-amber-50'}`}>
                        {p.status}
                      </span>
                      {test && <span className="text-[11px] text-gray-500">Test payment</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
