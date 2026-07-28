'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap'
import { updateAttendee, deleteAttendee, checkInAttendee } from '../actions'

const CATEGORIES = ['Delegate', 'International Delegate', 'Speaker', 'Organizing Committee']

type Attendee = {
  id: number
  firstName: string
  lastName: string
  email: string
  company: string
  position: string
  phone: string | null
  country: string | null
  category: string
  bio: string | null
  showInDirectory: boolean
  qrCode: string | null
  isConfirmed: boolean
  isBlocked: boolean
  checkedInAt: string | null
  createdAt: string
}

export default function EditAttendeeForm({ attendee }: { attendee: Attendee }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)

  const handleSubmit = (formData: FormData) => {
    setError('')
    startTransition(async () => {
      const result = await updateAttendee(attendee.id, formData)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Delete ${attendee.firstName} ${attendee.lastName}? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteAttendee(attendee.id)
      if (result.success) {
        router.push('/dashboard/attendees')
      } else {
        setError(result.error)
      }
    })
  }

  const handleCheckIn = async () => {
    setCheckingIn(true)
    await checkInAttendee(attendee.id)
    setCheckingIn(false)
    router.refresh()
  }

  return (
    <Row>
      <Col lg={8}>
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Registration Details</h5>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form action={handleSubmit}>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control name="firstName" defaultValue={attendee.firstName} required />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control name="lastName" defaultValue={attendee.lastName} required />
                </Col>
              </Row>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control type="email" name="email" defaultValue={attendee.email} required />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Position *</Form.Label>
                  <Form.Control name="position" defaultValue={attendee.position} required />
                </Col>
              </Row>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>Company *</Form.Label>
                  <Form.Control name="company" defaultValue={attendee.company} required />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control name="phone" defaultValue={attendee.phone || ''} />
                </Col>
              </Row>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control name="country" defaultValue={attendee.country || ''} />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select name="category" defaultValue={attendee.category} required>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isConfirmed"
                    label="Registration confirmed"
                    defaultChecked={attendee.isConfirmed}
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Check type="checkbox" name="isBlocked" label="Blocked" defaultChecked={attendee.isBlocked} />
                </Col>
              </Row>
              <div className="d-flex justify-content-between">
                <Button variant="secondary" type="button" onClick={() => router.push('/dashboard/attendees')}>
                  Back to List
                </Button>
                <Button variant="primary" type="submit" disabled={pending}>
                  {pending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h5 className="mb-0">Networking Profile</h5>
          </Card.Header>
          <Card.Body>
            <p className="text-muted small">
              Bio and directory visibility are managed by the attendee themselves via the networking portal.
              Shown here read-only.
            </p>
            <p>
              <strong>Bio:</strong> {attendee.bio || <span className="text-muted">Not set</span>}
            </p>
            <p className="mb-0">
              <strong>Visible in directory:</strong>{' '}
              {attendee.showInDirectory ? (
                <Badge bg="success">Yes</Badge>
              ) : (
                <Badge bg="secondary">Opted out</Badge>
              )}
            </p>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Status</h5>
          </Card.Header>
          <Card.Body>
            <p>
              <strong>QR Code:</strong>
              <br />
              <code>{attendee.qrCode}</code>
            </p>
            <p>
              <strong>Registered:</strong>
              <br />
              {new Date(attendee.createdAt).toLocaleString()}
            </p>
            <p className="mb-3">
              <strong>Check-in:</strong>
              <br />
              {attendee.checkedInAt ? (
                <Badge bg="success">Checked in {new Date(attendee.checkedInAt).toLocaleString()}</Badge>
              ) : (
                <Badge bg="warning" text="dark">
                  Not checked in
                </Badge>
              )}
            </p>
            {!attendee.checkedInAt && (
              <Button variant="success" className="w-100" disabled={checkingIn} onClick={handleCheckIn}>
                {checkingIn ? 'Checking in...' : 'Check In Now'}
              </Button>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h5 className="mb-0 text-danger">Danger Zone</h5>
          </Card.Header>
          <Card.Body>
            <Button variant="outline-danger" className="w-100" onClick={handleDelete} disabled={pending}>
              <i className="bi bi-trash me-1" /> Delete Attendee
            </Button>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
