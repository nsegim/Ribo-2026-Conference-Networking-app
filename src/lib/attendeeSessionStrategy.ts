import type { AuthStrategy } from 'payload'
import { parseCookies } from 'payload/shared'
import { ATTENDEE_SESSION_COOKIE, verifyAttendeeSessionToken } from './attendeeAuth'

// Resolves a request to an Attendee based on the persistent session cookie minted by
// /api/custom/magic-link/validate — NOT the magic-link token itself, which is single-use and
// only ever used once to establish this session. See attendeeAuth.ts for the split rationale.
export const attendeeSessionStrategy: AuthStrategy = {
  name: 'attendee-session',
  authenticate: async ({ headers, payload }) => {
    const cookies = parseCookies(headers)
    const token = cookies.get(ATTENDEE_SESSION_COOKIE)
    if (!token) return { user: null }

    const decoded = verifyAttendeeSessionToken(token)
    if (!decoded) return { user: null }

    const attendee = await payload
      .findByID({
        collection: 'attendees',
        id: decoded.attendeeId,
        overrideAccess: true,
      })
      .catch(() => null)

    if (!attendee || attendee.isBlocked) return { user: null }

    return {
      user: {
        ...attendee,
        collection: 'attendees',
        _strategy: 'attendee-session',
      },
    }
  },
}
