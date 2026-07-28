import config from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import EditAttendeeForm from './EditAttendeeForm'

export default async function AttendeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser(['superadmin', 'admin'])
  const { id } = await params

  const payload = await getPayload({ config })
  const attendee = await payload
    .findByID({ collection: 'attendees', id: Number(id), overrideAccess: true, depth: 1 })
    .catch(() => null)

  if (!attendee) notFound()

  return (
    <div>
      <h1 className="h2 mb-4">Attendee Details</h1>
      <EditAttendeeForm
        attendee={{
          id: attendee.id as number,
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          email: attendee.email,
          company: attendee.company,
          position: attendee.position,
          phone: attendee.phone ?? null,
          country: attendee.country ?? null,
          category: attendee.category,
          bio: attendee.bio ?? null,
          showInDirectory: attendee.showInDirectory ?? true,
          qrCode: attendee.qrCode ?? null,
          isConfirmed: attendee.isConfirmed ?? false,
          isBlocked: attendee.isBlocked ?? false,
          checkedInAt: attendee.checkedInAt ?? null,
          createdAt: attendee.createdAt,
        }}
      />
    </div>
  )
}
