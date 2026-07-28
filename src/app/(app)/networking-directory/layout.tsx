import config from '@payload-config'
import { getPayload } from 'payload'
import { getCurrentAttendee } from '@/lib/getCurrentAttendee'
import PortalNav from './PortalNav'

export default async function NetworkingPortalLayout({ children }: { children: React.ReactNode }) {
  const attendee = await getCurrentAttendee()

  let unreadCount = 0
  if (attendee) {
    const payload = await getPayload({ config })
    const unread = await payload.count({
      collection: 'messages',
      where: { recipient: { equals: attendee.id }, readAt: { exists: false } },
      overrideAccess: true,
    })
    unreadCount = unread.totalDocs
  }

  return (
    <div>
      {attendee && (
        <PortalNav fullName={`${attendee.firstName} ${attendee.lastName}`} unreadCount={unreadCount} />
      )}
      <div className="container pb-5">{children}</div>
    </div>
  )
}
