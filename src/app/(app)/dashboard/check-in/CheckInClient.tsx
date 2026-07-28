'use client'

import { useState, useTransition } from 'react'
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { recordCheckIn, type CheckInResult } from './actions'
import QRScanner from './QRScanner'

type SessionOption = { id: number; name: string; date: string; isActive: boolean }

export default function CheckInClient({ sessions }: { sessions: SessionOption[] }) {
  const defaultSession = sessions.find((s) => s.isActive) || null
  const [sessionId, setSessionId] = useState<string>(defaultSession ? String(defaultSession.id) : '')
  const [qrCode, setQrCode] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<CheckInResult | null>(null)

  const submit = (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    startTransition(async () => {
      const res = await recordCheckIn(sessionId ? Number(sessionId) : null, trimmed)
      setResult(res)
      setQrCode('')
    })
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(qrCode)
  }

  return (
    <div>
      <h1 className="h2 mb-1">Check-In</h1>
      <p className="text-muted">Scan or enter an attendee&apos;s badge QR code to check them in.</p>

      {result && (
        <Alert variant={result.success ? 'success' : 'danger'} className="mt-3">
          {result.success ? (
            <>
              <strong>{result.attendeeName}</strong> checked in successfully.
              {result.alreadyCheckedIn && ' (was already checked in overall)'}
              {sessionId && result.alreadyRecordedForSession && ' Already recorded for this session.'}
            </>
          ) : (
            result.error
          )}
        </Alert>
      )}

      <Row className="mt-3">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Session (optional — also records session attendance)</Form.Label>
                <Form.Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                  <option value="">No session — general check-in only</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.date).toLocaleDateString()}) {s.isActive ? '— Active' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form onSubmit={handleManualSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>QR Code</Form.Label>
                  <Form.Control
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Scan or type the code manually"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" disabled={pending || !qrCode.trim()}>
                  {pending ? 'Checking in...' : 'Check In'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Camera Scanner</h5>
            </Card.Header>
            <Card.Body>
              <QRScanner onScan={submit} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
