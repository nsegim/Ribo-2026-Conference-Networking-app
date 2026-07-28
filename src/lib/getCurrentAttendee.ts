import config from '@payload-config'
import { getPayload } from 'payload'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ATTENDEE_SESSION_COOKIE, verifyAttendeeSessionToken } from './attendeeAuth'
import type { Attendee } from '@/payload-types'

// Mirrors getCurrentAdminUser.ts, but for the attendee-session cookie (separate auth domain —
// see attendeeAuth.ts for why these are two distinct tokens/cookies).
export async function getCurrentAttendee(): Promise<Attendee | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ATTENDEE_SESSION_COOKIE)?.value
  if (!token) return null

  const decoded = verifyAttendeeSessionToken(token)
  if (!decoded) return null

  const payload = await getPayload({ config })
  const attendee = await payload
    .findByID({ collection: 'attendees', id: decoded.attendeeId, overrideAccess: true })
    .catch(() => null)

  if (!attendee || attendee.isBlocked) return null
  return attendee
}

// Call at the top of any portal sub-page (profile/inbox/sessions). Redirects to the portal root
// if there's no valid session — that page handles showing the "invalid or expired link" state.
export async function requireAttendee(): Promise<Attendee> {
  const attendee = await getCurrentAttendee()
  if (!attendee) redirect('/networking-directory')
  return attendee
}
