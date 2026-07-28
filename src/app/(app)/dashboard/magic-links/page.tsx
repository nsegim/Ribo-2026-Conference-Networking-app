import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import MagicLinksClient from './MagicLinksClient'

export default async function MagicLinksPage() {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  const [links, eligibleAttendees] = await Promise.all([
    payload.find({
      collection: 'magic-links',
      sort: '-createdAt',
      limit: 200,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'attendees',
      where: { isBlocked: { equals: false } },
      sort: 'firstName',
      limit: 1000,
      overrideAccess: true,
    }),
  ])

  return (
    <MagicLinksClient
      links={links.docs.map((link) => {
        const attendee = typeof link.attendee === 'object' ? link.attendee : null
        return {
          id: link.id as number,
          token: link.token,
          attendeeName: attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Unknown',
          attendeeEmail: attendee?.email || '',
          expiresAt: link.expiresAt,
          usedAt: link.usedAt ?? null,
          createdAt: link.createdAt,
        }
      })}
      eligibleAttendees={eligibleAttendees.docs.map((a) => ({
        id: a.id as number,
        name: `${a.firstName} ${a.lastName}`,
        email: a.email,
        company: a.company,
      }))}
    />
  )
}
