'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Table, Badge, Form, Button, Pagination } from 'react-bootstrap'
import { checkInAttendee } from './actions'

type Attendee = {
  id: number
  firstName: string
  lastName: string
  email: string
  company: string
  category: string
  checkedInAt: string | null
}

const categoryVariant: Record<string, string> = {
  'International Delegate': 'danger',
  Delegate: 'success',
  Speaker: 'primary',
  'Organizing Committee': 'dark',
}

export default function AttendeeListClient({
  attendees,
  totalDocs,
  totalPages,
  currentPage,
  search,
}: {
  attendees: Attendee[]
  totalDocs: number
  totalPages: number
  currentPage: number
  search: string
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)
  const [pending, startTransition] = useTransition()
  const [checkingInId, setCheckingInId] = useState<number | null>(null)

  const navigate = (params: { page?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page && params.page > 1) query.set('page', String(params.page))
    startTransition(() => {
      router.push(`/dashboard/attendees${query.toString() ? `?${query}` : ''}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ search: searchInput })
  }

  const handleCheckIn = async (id: number) => {
    setCheckingInId(id)
    await checkInAttendee(id)
    setCheckingInId(null)
    router.refresh()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Attendees</h1>
        <div>
          <Link href="/dashboard/attendees/import" className="btn btn-outline-primary me-2">
            <i className="bi bi-file-earmark-spreadsheet me-1" /> Import CSV
          </Link>
          <Link href="/dashboard/attendees/new" className="btn btn-primary">
            <i className="bi bi-person-plus me-1" /> Add Attendee
          </Link>
        </div>
      </div>

      <Card>
        <Card.Body>
          <div className="row mb-3">
            <div className="col-md-6">
              <Form onSubmit={handleSearch}>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, or company..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button type="submit" variant="primary" disabled={pending}>
                    <i className="bi bi-search" />
                  </Button>
                </div>
              </Form>
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-end text-muted">
              {totalDocs} attendee{totalDocs === 1 ? '' : 's'} total
            </div>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted" />
              <p className="mt-3">No attendees found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.firstName} {a.lastName}
                      </td>
                      <td>{a.email}</td>
                      <td>{a.company}</td>
                      <td>
                        <Badge bg={categoryVariant[a.category] || 'secondary'}>{a.category}</Badge>
                      </td>
                      <td>
                        {a.checkedInAt ? (
                          <Badge bg="success">Checked In</Badge>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Not Checked In
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <Link href={`/dashboard/attendees/${a.id}`} className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-eye" />
                          </Link>
                          {!a.checkedInAt && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              disabled={checkingInId === a.id}
                              onClick={() => handleCheckIn(a.id)}
                            >
                              <i className="bi bi-check-circle" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="justify-content-center mb-0">
              <Pagination.Prev disabled={currentPage <= 1} onClick={() => navigate({ page: currentPage - 1, search })} />
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
