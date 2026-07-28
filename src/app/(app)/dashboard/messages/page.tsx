import config from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import MessagesOversightClient from './MessagesOversightClient'

const PAGE_SIZE = 25

export default async function MessagesOversightPage({
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
          { subject: { contains: search } },
          { body: { contains: search } },
        ],
      }
    : {}

  const result = await payload.find({
    collection: 'messages',
    where,
    page,
    limit: PAGE_SIZE,
    sort: '-sentAt',
    depth: 1,
    overrideAccess: true,
  })

  const messages = result.docs.map((m) => {
    const sender = typeof m.sender === 'object' ? m.sender : null
    const recipient = typeof m.recipient === 'object' ? m.recipient : null
    return {
      id: m.id,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown',
      senderCompany: sender?.company || '',
      recipientName: recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Unknown',
      recipientCompany: recipient?.company || '',
      subject: m.subject,
      body: m.body,
      sentAt: m.sentAt ?? m.createdAt,
      readAt: m.readAt ?? null,
    }
  })

  return (
    <MessagesOversightClient
      messages={messages}
      totalDocs={result.totalDocs}
      totalPages={result.totalPages}
      currentPage={result.page ?? 1}
      search={search}
    />
  )
}
