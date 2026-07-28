import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import ReportsClient from './ReportsClient'

const CATEGORIES = ['Delegate', 'International Delegate', 'Speaker', 'Organizing Committee'] as const

export default async function ReportsPage() {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const now = new Date().toISOString()

  const [
    totalAttendees,
    checkedIn,
    categoryCounts,
    sessions,
    totalMessages,
    messagesToday,
    allMessagesForUniqueCounts,
    activeLinks,
    usedLinks,
    expiredLinks,
  ] = await Promise.all([
    payload.count({ collection: 'attendees', overrideAccess: true }),
    payload.count({ collection: 'attendees', where: { checkedInAt: { exists: true } }, overrideAccess: true }),
    Promise.all(
      CATEGORIES.map((category) =>
        payload
          .count({ collection: 'attendees', where: { category: { equals: category } }, overrideAccess: true })
          .then((r) => ({ category, count: r.totalDocs })),
      ),
    ),
    payload.find({ collection: 'sessions', sort: 'date', limit: 200, overrideAccess: true }),
    payload.count({ collection: 'messages', overrideAccess: true }),
    payload.count({
      collection: 'messages',
      where: { sentAt: { greater_than_equal: todayStart.toISOString() } },
      overrideAccess: true,
    }),
    // Single fetch reused to derive both unique-sender and unique-recipient counts below,
    // rather than querying the whole collection twice.
    payload.find({ collection: 'messages', limit: 10000, depth: 0, overrideAccess: true }),
    payload.count({
      collection: 'magic-links',
      where: { usedAt: { exists: false }, expiresAt: { greater_than: now } },
      overrideAccess: true,
    }),
    payload.count({ collection: 'magic-links', where: { usedAt: { exists: true } }, overrideAccess: true }),
    payload.count({
      collection: 'magic-links',
      where: { usedAt: { exists: false }, expiresAt: { less_than_equal: now } },
      overrideAccess: true,
    }),
  ])

  const uniqueSenders = new Set(
    allMessagesForUniqueCounts.docs.map((m) => (typeof m.sender === 'object' ? m.sender.id : m.sender)),
  ).size
  const uniqueRecipients = new Set(
    allMessagesForUniqueCounts.docs.map((m) => (typeof m.recipient === 'object' ? m.recipient.id : m.recipient)),
  ).size

  const sessionAttendance = await Promise.all(
    sessions.docs.map(async (s) => {
      const count = await payload.count({
        collection: 'session-attendance',
        where: { session: { equals: s.id } },
        overrideAccess: true,
      })
      return { id: s.id, name: s.name, date: s.date, isActive: s.isActive ?? false, attendance: count.totalDocs }
    }),
  )

  return (
    <ReportsClient
      totalAttendees={totalAttendees.totalDocs}
      checkedIn={checkedIn.totalDocs}
      categoryCounts={categoryCounts}
      sessionAttendance={sessionAttendance}
      messaging={{
        total: totalMessages.totalDocs,
        today: messagesToday.totalDocs,
        uniqueSenders,
        uniqueRecipients,
      }}
      magicLinks={{ active: activeLinks.totalDocs, used: usedLinks.totalDocs, expired: expiredLinks.totalDocs }}
    />
  )
}
