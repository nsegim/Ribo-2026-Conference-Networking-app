import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import { ATTENDEE_SESSION_COOKIE, ATTENDEE_SESSION_MAX_AGE_SECONDS, mintAttendeeSessionToken } from '@/lib/attendeeAuth'

// Public — this is the one-time exchange of a single-use magic-link token for a persistent
// attendee session. Everything after this call authenticates via the session cookie, not the
// magic-link token (see src/lib/attendeeAuth.ts for the two-token design rationale).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = body?.token

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ status: 'fail', message: 'Magic link token is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // Atomically claim the token: this update only affects a row if usedAt is still null, and
  // returns the docs it actually updated — if empty, either the token never existed or it was
  // already used (possibly by a concurrent request), so we can't tell those apart and don't need to.
  const claimed = await payload.update({
    collection: 'magic-links',
    where: { token: { equals: token }, usedAt: { exists: false } },
    data: { usedAt: new Date().toISOString() },
    depth: 1,
    overrideAccess: true,
  })

  const magicLink = claimed.docs[0]
  if (!magicLink) {
    return NextResponse.json({ status: 'fail', message: 'Invalid or already-used magic link' }, { status: 401 })
  }

  if (new Date(magicLink.expiresAt) < new Date()) {
    return NextResponse.json({ status: 'fail', message: 'Magic link has expired' }, { status: 401 })
  }

  const attendee = typeof magicLink.attendee === 'object' ? magicLink.attendee : null
  if (!attendee || attendee.isBlocked) {
    return NextResponse.json({ status: 'fail', message: 'Attendee account is not active' }, { status: 401 })
  }

  const sessionToken = mintAttendeeSessionToken(attendee.id as number)

  const response = NextResponse.json({
    status: 'success',
    data: {
      attendee: {
        id: attendee.id,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        position: attendee.position,
        company: attendee.company,
        category: attendee.category,
      },
    },
  })

  response.cookies.set(ATTENDEE_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ATTENDEE_SESSION_MAX_AGE_SECONDS,
    path: '/',
  })

  return response
}
