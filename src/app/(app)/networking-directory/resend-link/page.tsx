'use client'

import { useState, useTransition } from 'react'
import { Container, Card, Form, Button, Alert } from 'react-bootstrap'
import { requestMagicLink } from '../actions'

export default function ResendLinkPage() {
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await requestMagicLink(email)
      setSubmitted(true)
    })
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: 440, width: '100%' }}>
        <Card.Body className="text-center p-4">
          <h4 className="mb-3">Get a new access link</h4>
          {submitted ? (
            <Alert variant="success" className="mb-0">
              If that email is registered for RIBO2026, a fresh access link is on its way — check
              your inbox.
            </Alert>
          ) : (
            <>
              <p className="text-muted mb-3">
                Enter the email you registered with and we&apos;ll send you a new networking access
                link.
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3 text-start">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={pending}>
                  {pending ? 'Sending...' : 'Send me a link'}
                </Button>
              </Form>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}
