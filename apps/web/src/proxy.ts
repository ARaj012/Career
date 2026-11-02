import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Proxy
 *
 * Security headers are set for every route in next.config.ts. This proxy adds:
 * - CORS configuration for API routes
 * - Handles preflight OPTIONS requests
 * - Same-origin check on API mutations (CSRF)
 */

// Server-to-server callers that sign their own requests
const CSRF_EXEMPT = ['/api/payments/webhook']

function sameOrigin(request: NextRequest): boolean {
  const host = request.headers.get('host')
  if (!host) return false
  // Prefer Origin; fall back to Referer for older browsers
  const source = request.headers.get('origin') ?? request.headers.get('referer')
  if (!source) return false
  try {
    return new URL(source).host === host
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ]

    const origin = request.headers.get('origin')
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Vary', 'Origin')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }

    // CSRF protection for mutation methods
    if (
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
      !CSRF_EXEMPT.includes(pathname) &&
      !sameOrigin(request)
    ) {
      return new NextResponse('Cross-origin request blocked', { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
