import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ATTENDEE_SESSION_COOKIE, verifyAttendeeSessionToken } from '@/lib/attendeeAuth'

// Silent re-auth check: does this browser already have a valid attendee session? Used on app
// load instead of re-validating the magic link every time (which would break single-use).
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ATTENDEE_SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ status: 'fail', message: 'No session' }, { status: 401 })
  }

  const decoded = verifyAttendeeSessionToken(token)
  if (!decoded) {
    return NextResponse.json({ status: 'fail', message: 'Invalid or expired session' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const attendee = await payload
    .findByID({ collection: 'attendees', id: decoded.attendeeId, overrideAccess: true })
    .catch(() => null)

  if (!attendee || attendee.isBlocked) {
    return NextResponse.json({ status: 'fail', message: 'Attendee account is not active' }, { status: 401 })
  }

  return NextResponse.json({
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
}
