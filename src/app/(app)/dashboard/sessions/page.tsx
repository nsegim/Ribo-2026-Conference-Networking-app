import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import SessionListClient from './SessionListClient'

export default async function SessionsPage() {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  const sessions = await payload.find({
    collection: 'sessions',
    sort: 'date',
    limit: 200,
    overrideAccess: true,
  })

  const withCounts = await Promise.all(
    sessions.docs.map(async (session) => {
      const attendance = await payload.count({
        collection: 'session-attendance',
        where: { session: { equals: session.id } },
        overrideAccess: true,
      })
      return {
        id: session.id as number,
        name: session.name,
        date: session.date,
        description: session.description || '',
        isActive: session.isActive ?? false,
        attendanceCount: attendance.totalDocs,
      }
    }),
  )

  return <SessionListClient sessions={withCounts} />
}
