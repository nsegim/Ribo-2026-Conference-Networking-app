'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { createAttendee } from '../actions'

const CATEGORIES = ['Delegate', 'International Delegate', 'Speaker', 'Organizing Committee']

export default function CreateAttendeeForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (formData: FormData) => {
    setError('')
    startTransition(async () => {
      const result = await createAttendee(formData)
      if (result.success) {
        router.push('/dashboard/attendees')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Create New Attendee</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form action={handleSubmit}>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>First Name *</Form.Label>
              <Form.Control name="firstName" required />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Last Name *</Form.Label>
              <Form.Control name="lastName" required />
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control type="email" name="email" required />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Position *</Form.Label>
              <Form.Control name="position" required />
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Company *</Form.Label>
              <Form.Control name="company" required />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" />
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select name="category" defaultValue="Delegate" required>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={() => router.push('/dashboard/attendees')} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? 'Creating...' : 'Create Attendee'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
