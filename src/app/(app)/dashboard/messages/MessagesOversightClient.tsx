'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Table, Form, Button, Badge, Pagination } from 'react-bootstrap'

type MessageRow = {
  id: number
  senderName: string
  senderCompany: string
  recipientName: string
  recipientCompany: string
  subject: string
  body: string
  sentAt: string
  readAt: string | null
}

export default function MessagesOversightClient({
  messages,
  totalDocs,
  totalPages,
  currentPage,
  search,
}: {
  messages: MessageRow[]
  totalDocs: number
  totalPages: number
  currentPage: number
  search: string
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const navigate = (params: { page?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page && params.page > 1) query.set('page', String(params.page))
    router.push(`/dashboard/messages${query.toString() ? `?${query}` : ''}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ search: searchInput })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Messages</h1>
          <p className="text-muted mb-0">
            Read-only oversight of networking messages between attendees, for moderation.
          </p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSearch} className="mb-3">
            <div className="input-group" style={{ maxWidth: 480 }}>
              <Form.Control
                type="text"
                placeholder="Search subject or message body..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" variant="primary">
                <i className="bi bi-search" />
              </Button>
            </div>
          </Form>

          <p className="text-muted">{totalDocs} message(s) total</p>

          {messages.length === 0 ? (
            <p className="text-center text-muted py-4 mb-0">No messages found.</p>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Subject</th>
                    <th>Sent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <Fragment key={m.id}>
                      <tr role="button" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                        <td>
                          {m.senderName}
                          <br />
                          <small className="text-muted">{m.senderCompany}</small>
                        </td>
                        <td>
                          {m.recipientName}
                          <br />
                          <small className="text-muted">{m.recipientCompany}</small>
                        </td>
                        <td>{m.subject}</td>
                        <td>{new Date(m.sentAt).toLocaleString()}</td>
                        <td>
                          {m.readAt ? (
                            <Badge bg="success">Read</Badge>
                          ) : (
                            <Badge bg="warning" text="dark">
                              Unread
                            </Badge>
                          )}
                        </td>
                      </tr>
                      {expandedId === m.id && (
                        <tr>
                          <td colSpan={5} className="bg-light">
                            {m.body}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="justify-content-center mb-0">
              <Pagination.Prev
                disabled={currentPage <= 1}
                onClick={() => navigate({ page: currentPage - 1, search })}
              />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p} active={p === currentPage} onClick={() => navigate({ page: p, search })}>
                  {p}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={currentPage >= totalPages}
                onClick={() => navigate({ page: currentPage + 1, search })}
              />
            </Pagination>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
