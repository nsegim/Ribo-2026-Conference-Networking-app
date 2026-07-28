'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Table, Badge, Form } from 'react-bootstrap'
import { toggleSessionActive } from './actions'

type SessionRow = {
  id: number
  name: string
  date: string
  description: string
  isActive: boolean
  attendanceCount: number
}

export default function SessionListClient({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const handleToggle = (id: number, current: boolean) => {
    setTogglingId(id)
    startTransition(async () => {
      await toggleSessionActive(id, !current)
      router.refresh()
      setTogglingId(null)
    })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Sessions</h1>
        <Link href="/dashboard/sessions/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> New Session
        </Link>
      </div>

      <Card>
        <Card.Body>
          {sessions.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-event display-1 text-muted" />
              <p className="mt-3">No sessions yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Attendance</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{new Date(s.date).toLocaleString()}</td>
                      <td>
                        <Badge bg="secondary">{s.attendanceCount}</Badge>
                      </td>
                      <td>
                        <Form.Check
                          type="switch"
                          checked={s.isActive}
                          disabled={pending && togglingId === s.id}
                          onChange={() => handleToggle(s.id, s.isActive)}
                        />
                      </td>
                      <td>
                        <Link href={`/dashboard/sessions/${s.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye me-1" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
