import config from '@payload-config'
import { getPayload } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import CheckInClient from './CheckInClient'

export default async function CheckInPage() {
  // Every internal role can reach this page — it's staff's one and only tool.
  await requireAdminUser()
  const payload = await getPayload({ config })

  const sessions = await payload.find({
    collection: 'sessions',
    sort: '-date',
    limit: 100,
    overrideAccess: true,
  })

  const sessionOptions = sessions.docs.map((s) => ({
    id: s.id as number,
    name: s.name,
    date: s.date,
    isActive: s.isActive ?? false,
  }))

  return <CheckInClient sessions={sessionOptions} />
}
