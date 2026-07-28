import { NextResponse } from 'next/server'
import { ATTENDEE_SESSION_COOKIE } from '@/lib/attendeeAuth'

export async function POST() {
  const response = NextResponse.json({ status: 'success' })
  response.cookies.set(ATTENDEE_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
