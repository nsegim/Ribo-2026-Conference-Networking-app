import jwt from 'jsonwebtoken'

// The attendee-facing session is deliberately separate from the magic-link token itself
// (see architecture decision: single-use magic links exchanged for a persistent session).
// The magic link is a one-time exchange; this cookie is what every subsequent request
// actually authenticates against.
export const ATTENDEE_SESSION_COOKIE = 'attendee-session'
export const ATTENDEE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

type AttendeeSessionPayload = {
  attendeeId: number
}

export function mintAttendeeSessionToken(attendeeId: number): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  return jwt.sign({ attendeeId } satisfies AttendeeSessionPayload, secret, {
    expiresIn: ATTENDEE_SESSION_MAX_AGE_SECONDS,
  })
}

export function verifyAttendeeSessionToken(token: string): AttendeeSessionPayload | null {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  try {
    return jwt.verify(token, secret) as AttendeeSessionPayload
  } catch {
    return null
  }
}
