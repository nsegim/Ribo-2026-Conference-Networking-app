import config from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import SessionDetailClient from './SessionDetailClient'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser(['superadmin', 'admin'])
  const { id } = await params

  const payload = await getPayload({ config })
  const session = await payload
    .findByID({ collection: 'sessions', id: Number(id), overrideAccess: true })
    .catch(() => null)

  if (!session) notFound()

  const attendance = await payload.find({
    collection: 'session-attendance',
    where: { session: { equals: session.id } },
    sort: '-scannedAt',
    limit: 500,
    depth: 2,
    overrideAccess: true,
  })

  const categories: Record<string, number> = {}
  const attendanceList = attendance.docs.map((record) => {
    const attendee = typeof record.attendee === 'object' ? record.attendee : null
    const scannedBy = typeof record.scannedBy === 'object' ? record.scannedBy : null
    if (attendee) {
      categories[attendee.category] = (categories[attendee.category] || 0) + 1
    }
    return {
      id: record.id as number,
      name: attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Unknown',
      company: attendee?.company || '',
      category: attendee?.category || 'Unknown',
      scannedAt: record.scannedAt ?? record.createdAt,
      scannedBy: scannedBy?.fullName || null,
    }
  })

  return (
    <SessionDetailClient
      session={{
        id: session.id as number,
        name: session.name,
        date: session.date,
        description: session.description || '',
        isActive: session.isActive ?? false,
      }}
      categories={categories}
      attendanceList={attendanceList}
    />
  )
}
