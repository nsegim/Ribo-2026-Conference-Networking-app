import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAttendee } from '@/lib/getCurrentAttendee'
import InboxClient from './InboxClient'

export default async function InboxPage() {
  const attendee = await requireAttendee()
  const payload = await getPayload({ config })

  const [received, sent] = await Promise.all([
    payload.find({
      collection: 'messages',
      where: { recipient: { equals: attendee.id } },
      sort: '-sentAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'messages',
      where: { sender: { equals: attendee.id } },
      sort: '-sentAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  const mapMsg = (m: (typeof received.docs)[number], otherKey: 'sender' | 'recipient') => {
    const other = typeof m[otherKey] === 'object' ? m[otherKey] : null
    return {
      id: m.id,
      otherName: other ? `${other.firstName} ${other.lastName}` : 'Unknown',
      otherCompany: other?.company || '',
      subject: m.subject,
      body: m.body,
      sentAt: m.sentAt ?? m.createdAt,
      readAt: m.readAt ?? null,
    }
  }

  return (
    <InboxClient
      received={received.docs.map((m) => mapMsg(m, 'sender'))}
      sent={sent.docs.map((m) => mapMsg(m, 'recipient'))}
    />
  )
}
