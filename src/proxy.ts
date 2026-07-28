import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Optimistic check only — presence of the cookie, not signature/role verification. Next's own
// docs are explicit that Proxy/Middleware shouldn't be a full auth solution (no DB access here,
// Node-specific drivers like `pg` aren't reliably available at this layer). Real authorization
// (valid JWT, current role, per-page access) happens in requireAdminUser() inside each page's
// Server Component, which runs in the Node runtime and can safely call Payload's Local API.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has('payload-token')

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
