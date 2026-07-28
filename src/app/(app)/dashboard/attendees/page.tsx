import config from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import AttendeeListClient from './AttendeeListClient'

const PAGE_SIZE = 20

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  await requireAdminUser(['superadmin', 'admin'])
  const { page: pageParam, search = '' } = await searchParams
  const page = Number(pageParam) || 1

  const payload = await getPayload({ config })

  const where: Where = search
    ? {
        or: [
          { firstName: { contains: search } } satisfies Where,
          { lastName: { contains: search } } satisfies Where,
          { email: { contains: search } } satisfies Where,
          { company: { contains: search } } satisfies Where,
        ],
      }
    : {}

  const result = await payload.find({
    collection: 'attendees',
    where,
    page,
    limit: PAGE_SIZE,
    sort: 'firstName',
    overrideAccess: true,
  })

  return (
    <AttendeeListClient
      attendees={result.docs.map((a) => ({
        id: a.id as number,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        company: a.company,
        category: a.category,
        checkedInAt: a.checkedInAt ?? null,
      }))}
      totalDocs={result.totalDocs}
      totalPages={result.totalPages}
      currentPage={result.page ?? 1}
      search={search}
    />
  )
}
