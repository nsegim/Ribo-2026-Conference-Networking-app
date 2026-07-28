import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAttendee } from '@/lib/getCurrentAttendee'
import SessionScheduleClient from './SessionScheduleClient'

export default async function AttendeeSessionsPage() {
  await requireAttendee()
  const payload = await getPayload({ config })

  const sessions = await payload.find({
    collection: 'sessions',
    sort: 'date',
    limit: 200,
    overrideAccess: true,
  })

  return (
    <SessionScheduleClient
      sessions={sessions.docs.map((s) => ({
        id: s.id,
        name: s.name,
        date: s.date,
        description: s.description ?? '',
        isActive: s.isActive ?? false,
      }))}
    />
  )
}
