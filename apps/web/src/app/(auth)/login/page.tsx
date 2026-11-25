'use client'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const signInWithGoogle = async () => {
    setLoading(true)
    const safeNext = safeRedirectPath(next)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
      }
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-600">{BRAND_NAME}</h1>
          <p className="text-gray-500 mt-2 text-sm">{BRAND_TAGLINE}</p>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-500 mt-1">Sign in to continue your journey</p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-indigo-300 transition duration-200 shadow-sm"
        >
          {/* Google Icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* What signing in adds */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">With a free account you can</p>
          <ul className="space-y-2.5">
            {[
              'Save careers, colleges and exams',
              'Get email reminders before exam deadlines',
              'See scholarships that fit your profile',
              'Track your career roadmap progress',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-8">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-gray-600">Terms of Use</Link> and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}