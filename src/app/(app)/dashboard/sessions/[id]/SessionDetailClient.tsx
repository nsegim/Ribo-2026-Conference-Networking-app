'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Table, Badge, Row, Col, Form } from 'react-bootstrap'
import { toggleSessionActive } from '../actions'

const categoryVariant: Record<string, string> = {
  'International Delegate': 'danger',
  Delegate: 'success',
  Speaker: 'primary',
  'Organizing Committee': 'dark',
}

type Session = {
  id: number
  name: string
  date: string
  description: string
  isActive: boolean
}

type AttendanceRow = {
  id: number
  name: string
  company: string
  category: string
  scannedAt: string
  scannedBy: string | null
}

export default function SessionDetailClient({
  session,
  categories,
  attendanceList,
}: {
  session: Session
  categories: Record<string, number>
  attendanceList: AttendanceRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(session.isActive)

  const handleToggle = () => {
    const next = !isActive
    setIsActive(next)
    startTransition(async () => {
      await toggleSessionActive(session.id, next)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h2 mb-1">{session.name}</h1>
          <p className="text-muted mb-0">{new Date(session.date).toLocaleString()}</p>
        </div>
        <Form.Check
          type="switch"
          label={isActive ? 'Active' : 'Inactive'}
          checked={isActive}
          disabled={pending}
          onChange={handleToggle}
        />
      </div>

      {session.description && <p className="mb-4">{session.description}</p>}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h6>Attendance by Category</h6>
              <div className="d-flex flex-wrap gap-2">
                {Object.keys(categories).length === 0 ? (
                  <span className="text-muted">No attendance recorded yet.</span>
                ) : (
                  Object.entries(categories).map(([category, count]) => (
                    <Badge key={category} bg={categoryVariant[category] || 'secondary'} className="p-2">
                      {category}: {count}
                    </Badge>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Attendance List ({attendanceList.length})</h5>
        </Card.Header>
        <Card.Body>
          {attendanceList.length === 0 ? (
            <p className="text-muted mb-0">No one has been scanned in for this session yet.</p>
          ) : (
            <div className="table-responsive" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Category</th>
                    <th>Time</th>
                    <th>Scanned By</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((record) => (
                    <tr key={record.id}>
                      <td>{record.name}</td>
                      <td>{record.company}</td>
                      <td>
                        <Badge bg={categoryVariant[record.category] || 'secondary'}>{record.category}</Badge>
                      </td>
                      <td>{new Date(record.scannedAt).toLocaleString()}</td>
                      <td>{record.scannedBy || <span className="text-muted">—</span>}</td>
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
