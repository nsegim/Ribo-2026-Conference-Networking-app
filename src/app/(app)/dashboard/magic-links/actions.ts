'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import { createAndSendMagicLink } from '@/lib/magicLink'
import type { ActionResult } from '../attendees/actions'

export async function generateMagicLink(attendeeId: number): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    const attendee = await payload.findByID({ collection: 'attendees', id: attendeeId, overrideAccess: true })
    if (!attendee) return { success: false, error: 'Attendee not found' }
    if (attendee.isBlocked) return { success: false, error: 'Attendee is blocked' }

    await createAndSendMagicLink(payload, attendee)
    revalidatePath('/dashboard/magic-links')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to generate magic link' }
  }
}

export type BulkResult = {
  total: number
  successful: number
  failed: { attendeeId: number; reason: string }[]
}

// NOTE: sequential, synchronous — correct for the current scale (low hundreds of attendees), but
// at larger scale this should move to a background job queue (e.g. Payload's Jobs Queue) rather
// than running the whole loop inside one request, which risks serverless execution-time limits.
export async function generateBulkMagicLinks(attendeeIds: number[]): Promise<BulkResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  const result: BulkResult = { total: attendeeIds.length, successful: 0, failed: [] }

  for (const attendeeId of attendeeIds) {
    try {
      const attendee = await payload.findByID({ collection: 'attendees', id: attendeeId, overrideAccess: true })
      if (!attendee || attendee.isBlocked) {
        result.failed.push({ attendeeId, reason: 'Attendee not eligible (missing or blocked)' })
        continue
      }

      const existingActive = await payload.find({
        collection: 'magic-links',
        where: {
          attendee: { equals: attendeeId },
          usedAt: { exists: false },
          expiresAt: { greater_than: new Date().toISOString() },
        },
        limit: 1,
        overrideAccess: true,
      })
      if (existingActive.docs.length > 0) {
        result.failed.push({ attendeeId, reason: 'Active magic link already exists' })
        continue
      }

      await createAndSendMagicLink(payload, attendee)
      result.successful++
    } catch (err) {
      result.failed.push({ attendeeId, reason: err instanceof Error ? err.message : 'Failed to generate' })
    }
  }

  revalidatePath('/dashboard/magic-links')
  return result
}
