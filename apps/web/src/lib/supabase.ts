import { createBrowserClient } from '@supabase/ssr'

type Client = ReturnType<typeof createBrowserClient>

/**
 * Every open tab of the site shares one browser lock on the sign-in token. When a tab
 * holds it too long, another tab takes it over ("Lock ... was released because another
 * request stole it" / "Lock broken by another request with the 'steal' option") and the
 * waiting getUser()/getSession() call throws. The session itself is fine, so trying
 * again a moment later succeeds.
 */
export function isAuthLockLoss(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null
  if (!e) return false
  return e.name === 'AbortError' || /lock .*(released|stole)|lock broken|steal/i.test(e.message ?? '')
}

const patched = new WeakSet<object>()

function retryOnLockLoss(client: Client) {
  if (patched.has(client)) return
  patched.add(client)
  const auth = client.auth
  for (const method of ['getUser', 'getSession'] as const) {
    const original = auth[method].bind(auth) as (...args: unknown[]) => Promise<unknown>
    ;(auth as unknown as Record<string, unknown>)[method] = async (...args: unknown[]) => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await original(...args)
        } catch (err) {
          if (attempt >= 2 || !isAuthLockLoss(err)) throw err
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)))
        }
      }
    }
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // In the browser this is one shared client; it is patched once
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  retryOnLockLoss(client)
  return client
}
