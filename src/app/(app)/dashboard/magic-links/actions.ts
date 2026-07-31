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
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 0; font-family: Arial, Helvetica, sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; max-width:600px; width:100%;">
              <tr>
                <td style="background-color:#325F12; padding:24px 32px;">
                  <span style="color:#ffffff; font-size:20px; font-weight:bold; letter-spacing:0.5px;">RIBO2026 CONFERENCE</span>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 16px; font-size:16px; color:#1f2933;">Dear ${firstName},</p>
                  <p style="margin:0 0 24px; font-size:15px; color:#3e4c59; line-height:1.5;">
                    Welcome to the RIBO2026 Networking Directory. Use the button below to access it instantly — no password required.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td style="background-color:#76C042; border-radius:6px;">
                        <a href="${magicLinkUrl}" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;">
                          Access Networking Directory
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0; font-size:13px; color:#7b8794;">
                    This link is valid for ${MAGIC_LINK_TTL_DAYS} days and can only be used once. If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#F3F6EA; padding:16px 32px; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#7b8794;">RIBO2026 Conference &middot; This is an automated message, please do not reply.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
