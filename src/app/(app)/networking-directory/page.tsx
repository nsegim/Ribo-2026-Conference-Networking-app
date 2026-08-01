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
  searchParams: Promise<{
    token?: string
    search?: string
    company?: string
    country?: string
    industry?: string
    availability?: string
  }>
}) {
  const { token, search = '', company = '', country = '', industry = '', availability = '' } = await searchParams

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

  // Base pool: every filter/stat/option-list below is derived from this same definition of
  // "who's visible in the directory" so the numbers on the hero and the filter dropdowns always
  // agree with what the grid actually shows before any user-chosen filter is applied.
  //
  // Gated on isConfirmed (organizer has vetted the registration), not checkedInAt (physically
  // walked up to the venue) — deliberate product decision: networking should open as soon as a
  // registration is confirmed, not wait for physical check-in, so attendees can arrange meetings
  // ahead of arriving rather than only during the event itself.
  const basePool: Where = {
    and: [
      { id: { not_equals: attendee.id } },
      { showInDirectory: { equals: true } },
      { isBlocked: { equals: false } },
      { isConfirmed: { equals: true } },
    ],
  }

  const filterClauses: Where[] = []
  if (search) {
    filterClauses.push({
      or: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { company: { contains: search } },
        { position: { contains: search } },
      ],
    })
  }
  if (company) filterClauses.push({ company: { equals: company } })
  if (country) filterClauses.push({ country: { equals: country } })
  if (industry) filterClauses.push({ industry: { equals: industry } })
  if (availability) filterClauses.push({ networkingStatus: { equals: availability } })

  const where: Where = filterClauses.length > 0 ? { and: [...basePool.and!, ...filterClauses] } : basePool

  // Single pool of full field data: used for the visible grid, the hero stats (attendee/company/
  // country counts), and the filter dropdown options alike. At this scale (low hundreds of
  // attendees) fetching the whole base pool once is simpler and cheaper than separate aggregate
  // queries, and keeps every number on the page mutually consistent.
  const [filteredResult, basePoolResult] = await Promise.all([
    payload.find({ collection: 'attendees', where, sort: 'firstName', limit: 500, depth: 1, overrideAccess: true }),
    payload.find({ collection: 'attendees', where: basePool, limit: 1000, depth: 0, overrideAccess: true }),
  ])

  // Hand-pick public-safe fields only — overrideAccess bypassed Payload's own field-level
  // protection to run this query, so this application code is what actually enforces "no
  // email/phone/category leak into the directory", not the collection config.
  const attendees = filteredResult.docs.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    position: a.position,
    country: a.country ?? null,
    industry: a.industry ?? null,
    networkingStatus: a.networkingStatus ?? 'open',
    bio: a.bio ?? null,
    interests: (a.interests ?? []).map((i) => i.label),
    profileImageUrl: typeof a.profileImage === 'object' && a.profileImage ? a.profileImage.url ?? null : null,
  }))

  const uniqueSorted = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => !!v && v.trim().length > 0))).sort((a, b) =>
      a.localeCompare(b),
    )

  const stats = {
    totalAttendees: basePoolResult.totalDocs,
    totalCompanies: uniqueSorted(basePoolResult.docs.map((a) => a.company)).length,
    totalCountries: uniqueSorted(basePoolResult.docs.map((a) => a.country)).length,
  }

  const filterOptions = {
    companies: uniqueSorted(basePoolResult.docs.map((a) => a.company)),
    countries: uniqueSorted(basePoolResult.docs.map((a) => a.country)),
    industries: uniqueSorted(basePoolResult.docs.map((a) => a.industry)),
  }

  return (
    <DirectoryClient
      attendees={attendees}
      stats={stats}
      filterOptions={filterOptions}
      filters={{ search, company, country, industry, availability }}
    />
  )
}
