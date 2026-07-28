'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import type { ActionResult } from '../attendees/actions'

const MAGIC_LINK_TTL_DAYS = 7

function buildMagicLinkEmail(firstName: string, magicLinkUrl: string) {
  return {
    subject: 'Your RIBO2026 Networking Access',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">RIBO2026 Conference</h2>
        <p>Dear ${firstName},</p>
        <p>Welcome to the Networking Directory. Use the link below to access it — no password required.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLinkUrl}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Access Networking Directory
          </a>
        </div>
        <p>This link is valid for ${MAGIC_LINK_TTL_DAYS} days and can only be used once.</p>
      </div>
    `,
  }
}

async function createAndSendMagicLink(
  payload: Awaited<ReturnType<typeof getPayload>>,
  attendee: { id: number; email: string; firstName: string },
) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + MAGIC_LINK_TTL_DAYS)

  await payload.create({
    collection: 'magic-links',
    overrideAccess: true,
    data: { token, attendee: attendee.id, expiresAt: expiresAt.toISOString() },
  })

  const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/networking-directory?token=${token}`
  const { subject, html } = buildMagicLinkEmail(attendee.firstName, magicLinkUrl)

  await payload.sendEmail({ to: attendee.email, subject, html })
}

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
