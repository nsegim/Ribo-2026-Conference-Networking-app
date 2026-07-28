import config from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import { getCurrentAttendee } from '@/lib/getCurrentAttendee'
import TokenExchange from './TokenExchange'
import DirectoryClient from './DirectoryClient'
import InvalidLinkNotice from './InvalidLinkNotice'

export default async function NetworkingDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; search?: string }>
}) {
  const { token, search = '' } = await searchParams

  // A token in the URL always takes priority — hand off to the client to exchange it for a
  // session, regardless of whether an old session cookie also happens to be present.
  if (token) {
    return <TokenExchange token={token} />
  }

  const attendee = await getCurrentAttendee()

  if (!attendee) {
    return <InvalidLinkNotice />
  }

  const payload = await getPayload({ config })

  const where: Where = search
    ? {
        and: [
          { id: { not_equals: attendee.id } },
          { showInDirectory: { equals: true } },
          { isBlocked: { equals: false } },
          {
            or: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { company: { contains: search } },
              { position: { contains: search } },
            ],
          },
        ],
      }
    : {
        and: [
          { id: { not_equals: attendee.id } },
          { showInDirectory: { equals: true } },
          { isBlocked: { equals: false } },
        ],
      }

  const result = await payload.find({
    collection: 'attendees',
    where,
    sort: 'firstName',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  // Hand-pick public-safe fields only — overrideAccess bypassed Payload's own field-level
  // protection to run this query, so this application code is what actually enforces "no
  // email/phone/category leak into the directory", not the collection config.
  const attendees = result.docs.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    position: a.position,
    country: a.country ?? null,
    bio: a.bio ?? null,
    interests: (a.interests ?? []).map((i) => i.label),
    profileImageUrl: typeof a.profileImage === 'object' && a.profileImage ? a.profileImage.url ?? null : null,
  }))

  return <DirectoryClient attendees={attendees} search={search} />
}
