import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { safeRedirectPath } from '@/lib/safe-redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      try {
        // user_accounts is server-written. Create the row if it's missing, but
        // never overwrite an existing one (that would re-activate a disabled account).
        const admin = createAdminSupabaseClient()
        await admin.from('user_accounts').upsert({
          user_id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || null,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id', ignoreDuplicates: true })

        const { data: account } = await admin
          .from('user_accounts')
          .select('is_active')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (account && account.is_active === false) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=account_disabled`)
        }
      } catch (accountError) {
        console.error('Account sync failed:', accountError instanceof Error ? accountError.message : accountError)
      }

      // Create free subscription for new users
      await supabase.rpc('create_free_subscription', { p_user_id: data.user.id })
    }
  }

  return NextResponse.redirect(`${origin}${safeRedirectPath(searchParams.get('next'))}`)
}
