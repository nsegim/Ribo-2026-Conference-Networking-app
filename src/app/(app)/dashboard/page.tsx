import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import DashboardStats from './DashboardStats'

export default async function DashboardPage() {
  const user = await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  const [totalAttendees, checkedIn, totalSessions, totalMessages, activeMagicLinks] = await Promise.all([
    payload.count({ collection: 'attendees', overrideAccess: true }),
    payload.count({ collection: 'attendees', where: { checkedInAt: { exists: true } }, overrideAccess: true }),
    payload.count({ collection: 'sessions', overrideAccess: true }),
    payload.count({ collection: 'messages', overrideAccess: true }),
    payload.count({
      collection: 'magic-links',
      where: { usedAt: { exists: false }, expiresAt: { greater_than: new Date().toISOString() } },
      overrideAccess: true,
    }),
  ])

  const stats = [
    { label: 'Total Registrants', value: totalAttendees.totalDocs, icon: 'bi-people' },
    { label: 'Checked In', value: checkedIn.totalDocs, icon: 'bi-qr-code-scan' },
    { label: 'Sessions', value: totalSessions.totalDocs, icon: 'bi-calendar-event' },
    { label: 'Messages Sent', value: totalMessages.totalDocs, icon: 'bi-chat-dots' },
    { label: 'Active Magic Links', value: activeMagicLinks.totalDocs, icon: 'bi-link-45deg' },
  ]

  return (
    <div>
      <h1 className="h2 mb-1">Dashboard</h1>
      <p className="text-muted">Welcome back, {user.fullName}</p>
      <DashboardStats stats={stats} />
    </div>
  )
}
