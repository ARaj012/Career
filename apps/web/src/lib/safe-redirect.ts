/**
 * Returns `next` only if it is a same-site path ("/dashboard?tab=1"), else the
 * fallback. Rejects "//evil.com", "/\evil.com" and anything with a scheme.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || typeof next !== 'string') return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\\]/.test(next)) return fallback
  try {
    const url = new URL(next, 'http://local.invalid')
    if (url.origin !== 'http://local.invalid') return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}
