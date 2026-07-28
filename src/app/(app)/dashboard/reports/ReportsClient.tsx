'use client'

import { Row, Col, Card, Table, Badge, ProgressBar } from 'react-bootstrap'

type CategoryCount = { category: string; count: number }
type SessionRow = { id: number; name: string; date: string; isActive: boolean; attendance: number }

const categoryVariant: Record<string, string> = {
  'International Delegate': 'danger',
  Delegate: 'success',
  Speaker: 'primary',
  'Organizing Committee': 'dark',
}

export default function ReportsClient({
  totalAttendees,
  checkedIn,
  categoryCounts,
  sessionAttendance,
  messaging,
  magicLinks,
}: {
  totalAttendees: number
  checkedIn: number
  categoryCounts: CategoryCount[]
  sessionAttendance: SessionRow[]
  messaging: { total: number; today: number; uniqueSenders: number; uniqueRecipients: number }
  magicLinks: { active: number; used: number; expired: number }
}) {
  const checkInRate = totalAttendees > 0 ? Math.round((checkedIn / totalAttendees) * 100) : 0
  const totalLinks = magicLinks.active + magicLinks.used + magicLinks.expired

  return (
    <div>
      <h1 className="h2 mb-4">Reports</h1>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Check-In Rate</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>
                  {checkedIn} of {totalAttendees} registered
                </span>
                <strong>{checkInRate}%</strong>
              </div>
              <ProgressBar now={checkInRate} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Attendees by Category</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                {categoryCounts.map((c) => (
                  <Badge key={c.category} bg={categoryVariant[c.category] || 'secondary'} className="p-2">
                    {c.category}: {c.count}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Messaging</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless size="sm" className="mb-0">
                <tbody>
                  <tr>
                    <td>Total messages sent</td>
                    <td className="text-end fw-bold">{messaging.total}</td>
                  </tr>
                  <tr>
                    <td>Sent today</td>
                    <td className="text-end fw-bold">{messaging.today}</td>
                  </tr>
                  <tr>
                    <td>Unique attendees who sent a message</td>
                    <td className="text-end fw-bold">{messaging.uniqueSenders}</td>
                  </tr>
                  <tr>
                    <td>Unique attendees who received a message</td>
                    <td className="text-end fw-bold">{messaging.uniqueRecipients}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Magic Links ({totalLinks} total)</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="success" className="p-2">
                  Active: {magicLinks.active}
                </Badge>
                <Badge bg="secondary" className="p-2">
                  Used: {magicLinks.used}
                </Badge>
                <Badge bg="warning" text="dark" className="p-2">
                  Expired: {magicLinks.expired}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Attendance by Session</h5>
        </Card.Header>
        <Card.Body>
          {sessionAttendance.length === 0 ? (
            <p className="text-muted mb-0">No sessions created yet.</p>
          ) : (
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessionAttendance.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{new Date(s.date).toLocaleString()}</td>
                    <td>{s.attendance}</td>
                    <td>{s.isActive && <Badge bg="success">Active</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
