'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'

export type CheckInResult =
  | {
      success: true
      attendeeName: string
      alreadyCheckedIn: boolean
      alreadyRecordedForSession: boolean
    }
  | { success: false; error: string }

// Available to any internal role (staff included) — this is the one feature staff need.
export async function recordCheckIn(sessionId: number | null, qrCode: string): Promise<CheckInResult> {
  const user = await requireAdminUser()
  const payload = await getPayload({ config })

  const trimmedCode = qrCode.trim()
  if (!trimmedCode) {
    return { success: false, error: 'QR code is required' }
  }

  const found = await payload.find({
    collection: 'attendees',
    where: { qrCode: { equals: trimmedCode } },
    limit: 1,
    overrideAccess: true,
  })
  const attendee = found.docs[0]

  if (!attendee) {
    return { success: false, error: 'No attendee found for this QR code' }
  }
  if (attendee.isBlocked) {
    return { success: false, error: `${attendee.firstName} ${attendee.lastName} is blocked and cannot be checked in` }
  }

  const alreadyCheckedIn = Boolean(attendee.checkedInAt)
  if (!alreadyCheckedIn) {
    await payload.update({
      id: attendee.id,
      collection: 'attendees',
      overrideAccess: true,
      data: { checkedInAt: new Date().toISOString() },
    })
  }

  let alreadyRecordedForSession = false
  if (sessionId) {
    const existingAttendance = await payload.find({
      collection: 'session-attendance',
      where: { session: { equals: sessionId }, attendee: { equals: attendee.id } },
      limit: 1,
      overrideAccess: true,
    })
    if (existingAttendance.docs.length > 0) {
      alreadyRecordedForSession = true
    } else {
      await payload.create({
        collection: 'session-attendance',
        overrideAccess: true,
        data: { session: sessionId, attendee: attendee.id, scannedBy: user.id },
      })
    }
  }

  revalidatePath('/dashboard/attendees')
  revalidatePath('/dashboard/sessions')
  if (sessionId) revalidatePath(`/dashboard/sessions/${sessionId}`)

  return {
    success: true,
    attendeeName: `${attendee.firstName} ${attendee.lastName}`,
    alreadyCheckedIn,
    alreadyRecordedForSession,
  }
}
