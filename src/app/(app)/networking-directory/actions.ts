'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { requireAttendee } from '@/lib/getCurrentAttendee'
import { createAndSendMagicLink } from '@/lib/magicLink'

export type ActionResult = { success: true } | { success: false; error: string }

// Deliberately not gated by requireAttendee — this is exactly for people who don't have a valid
// session. Always returns success regardless of whether the email matches a real attendee, so
// this can't be used to enumerate who's registered.
export async function requestMagicLink(email: string): Promise<ActionResult> {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { success: false, error: 'Email is required' }

  const payload = await getPayload({ config })

  try {
    const result = await payload.find({
      collection: 'attendees',
      where: { email: { equals: trimmed } },
      limit: 1,
      overrideAccess: true,
    })
    const attendee = result.docs[0]
    if (attendee && !attendee.isBlocked) {
      await createAndSendMagicLink(payload, attendee)
    }
  } catch {
    // Swallowed deliberately — this endpoint always reports success to the caller either way.
  }

  return { success: true }
}

export async function sendMessage(recipientId: number, subject: string, body: string): Promise<ActionResult> {
  const sender = await requireAttendee()
  const payload = await getPayload({ config })

  const trimmedSubject = subject.trim()
  const trimmedBody = body.trim()
  if (!trimmedSubject || !trimmedBody) {
    return { success: false, error: 'Subject and message are required' }
  }
  if (recipientId === sender.id) {
    return { success: false, error: "You can't message yourself" }
  }

  try {
    const recipient = await payload.findByID({ collection: 'attendees', id: recipientId, overrideAccess: true })
    if (!recipient || recipient.isBlocked) {
      return { success: false, error: 'This attendee is not available to message' }
    }

    await payload.create({
      collection: 'messages',
      overrideAccess: true,
      data: {
        sender: sender.id,
        recipient: recipient.id,
        subject: trimmedSubject,
        body: trimmedBody,
      },
    })

    // Relay email — the recipient never sees the sender's real address in the message body;
    // replyTo lets them respond directly without the platform exposing either party's inbox to
    // the other beyond what's needed for a reply.
    await payload.sendEmail({
      to: recipient.email,
      replyTo: sender.email,
      subject: `RIBO2026 Networking: ${trimmedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">RIBO2026 Conference Networking</h2>
          <p>You have received a message from:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Name:</strong> ${sender.firstName} ${sender.lastName}</p>
            <p><strong>Position:</strong> ${sender.position}</p>
            <p><strong>Company:</strong> ${sender.company}</p>
          </div>
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>${trimmedSubject}</strong></p>
            <p>${trimmedBody}</p>
          </div>
          <p>You can reply directly to this email to respond to ${sender.firstName}.</p>
        </div>
      `,
    })

    revalidatePath('/networking-directory/inbox')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send message' }
  }
}

export async function markMessageRead(messageId: number): Promise<ActionResult> {
  const attendee = await requireAttendee()
  const payload = await getPayload({ config })

  try {
    const message = await payload.findByID({ collection: 'messages', id: messageId, overrideAccess: true })
    const recipientId = typeof message.recipient === 'object' ? message.recipient.id : message.recipient
    if (recipientId !== attendee.id) {
      return { success: false, error: 'Not your message' }
    }
    if (!message.readAt) {
      await payload.update({
        id: messageId,
        collection: 'messages',
        overrideAccess: true,
        data: { readAt: new Date().toISOString() },
      })
    }
    revalidatePath('/networking-directory/inbox')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to mark as read' }
  }
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const attendee = await requireAttendee()
  const payload = await getPayload({ config })

  try {
    const bio = String(formData.get('bio') || '').slice(0, 500)
    const country = String(formData.get('country') || '').trim() || null
    const industry = String(formData.get('industry') || '').trim() || null
    const networkingStatusRaw = String(formData.get('networkingStatus') || 'open')
    const networkingStatus = networkingStatusRaw === 'busy' ? 'busy' : 'open'
    const showInDirectory = formData.get('showInDirectory') === 'on'
    const interestsRaw = String(formData.get('interests') || '')
    const interests = interestsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15)
      .map((label) => ({ label: label.slice(0, 40) }))

    const photo = formData.get('photo') as File | null
    let profileImageId: number | undefined

    if (photo && photo.size > 0) {
      const arrayBuffer = await photo.arrayBuffer()
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: `${attendee.firstName} ${attendee.lastName} profile photo` },
        file: {
          data: Buffer.from(arrayBuffer),
          mimetype: photo.type,
          name: photo.name,
          size: photo.size,
        },
      })
      profileImageId = media.id
    }

    await payload.update({
      id: attendee.id,
      collection: 'attendees',
      overrideAccess: true,
      data: {
        bio,
        country,
        industry,
        networkingStatus,
        showInDirectory,
        interests,
        ...(profileImageId ? { profileImage: profileImageId } : {}),
      },
    })

    revalidatePath('/networking-directory/profile')
    revalidatePath('/networking-directory')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' }
  }
}
