'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { createSession } from '../actions'

export default function CreateSessionForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (formData: FormData) => {
    setError('')
    startTransition(async () => {
      const result = await createSession(formData)
      if (result.success) {
        router.push('/dashboard/sessions')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">New Session</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form action={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control name="name" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Date &amp; Time *</Form.Label>
            <Form.Control type="datetime-local" name="date" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} name="description" />
          </Form.Group>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" type="button" onClick={() => router.push('/dashboard/sessions')}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? 'Creating...' : 'Create Session'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
