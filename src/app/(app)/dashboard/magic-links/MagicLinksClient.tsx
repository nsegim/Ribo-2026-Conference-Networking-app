'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Table, Badge, Form, Button, Alert, Modal, Row, Col } from 'react-bootstrap'
import { generateMagicLink, generateBulkMagicLinks, type BulkResult } from './actions'

type MagicLink = {
  id: number
  token: string
  attendeeName: string
  attendeeEmail: string
  expiresAt: string
  usedAt: string | null
  createdAt: string
}

type EligibleAttendee = { id: number; name: string; email: string; company: string }

function getStatus(link: MagicLink): { label: string; variant: string } {
  if (link.usedAt) return { label: 'Used', variant: 'secondary' }
  if (new Date(link.expiresAt) < new Date()) return { label: 'Expired', variant: 'warning' }
  return { label: 'Active', variant: 'success' }
}

export default function MagicLinksClient({
  links,
  eligibleAttendees,
}: {
  links: MagicLink[]
  eligibleAttendees: EligibleAttendee[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [selectedAttendee, setSelectedAttendee] = useState('')
  const [singleMessage, setSingleMessage] = useState<{ text: string; variant: string } | null>(null)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const handleGenerateSingle = () => {
    if (!selectedAttendee) return
    setSingleMessage(null)
    startTransition(async () => {
      const result = await generateMagicLink(Number(selectedAttendee))
      if (result.success) {
        setSingleMessage({ text: 'Magic link generated and emailed.', variant: 'success' })
        setSelectedAttendee('')
        router.refresh()
      } else {
        setSingleMessage({ text: result.error, variant: 'danger' })
      }
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? eligibleAttendees.map((a) => a.id) : [])
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleBulkConfirm = () => {
    startTransition(async () => {
      const result = await generateBulkMagicLinks(selectedIds)
      setBulkResult(result)
      router.refresh()
    })
  }

  const copyLink = (link: MagicLink) => {
    const url = `${window.location.origin}/networking-directory?token=${link.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <h1 className="h2 mb-4">Magic Link Management</h1>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Generate Single Link</h5>
            </Card.Header>
            <Card.Body>
              {singleMessage && <Alert variant={singleMessage.variant}>{singleMessage.text}</Alert>}
              <Form.Group className="mb-3">
                <Form.Label>Attendee</Form.Label>
                <Form.Select value={selectedAttendee} onChange={(e) => setSelectedAttendee(e.target.value)}>
                  <option value="">Choose an attendee...</option>
                  {eligibleAttendees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.company} ({a.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Button disabled={!selectedAttendee || pending} onClick={handleGenerateSingle}>
                {pending ? 'Generating...' : 'Generate Link'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Bulk Generate</h5>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="checkbox"
                label={`Select all eligible (${eligibleAttendees.length})`}
                checked={selectedIds.length === eligibleAttendees.length && eligibleAttendees.length > 0}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
              <div className="mb-3" style={{ maxHeight: 180, overflowY: 'auto' }}>
                {eligibleAttendees.map((a) => (
                  <Form.Check
                    key={a.id}
                    type="checkbox"
                    label={`${a.name} (${a.company})`}
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleOne(a.id)}
                  />
                ))}
              </div>
              <Button
                variant="warning"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  setBulkResult(null)
                  setShowBulkModal(true)
                }}
              >
                Send to {selectedIds.length} Selected
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Generated Magic Links ({links.length})</h5>
        </Card.Header>
        <Card.Body>
          {links.length === 0 ? (
            <p className="text-muted mb-0">No magic links generated yet.</p>
          ) : (
            <div className="table-responsive" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Generated</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const status = getStatus(link)
                    return (
                      <tr key={link.id}>
                        <td>
                          {link.attendeeName}
                          <br />
                          <small className="text-muted">{link.attendeeEmail}</small>
                        </td>
                        <td>{new Date(link.createdAt).toLocaleString()}</td>
                        <td>{new Date(link.expiresAt).toLocaleString()}</td>
                        <td>
                          <Badge bg={status.variant}>{status.label}</Badge>
                        </td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => copyLink(link)}>
                            {copiedId === link.id ? 'Copied!' : 'Copy Link'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showBulkModal} onHide={() => !pending && setShowBulkModal(false)}>
        <Modal.Header closeButton={!pending}>
          <Modal.Title>Confirm Bulk Generation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!bulkResult ? (
            <Alert variant="warning">
              You are about to send magic links to <strong>{selectedIds.length}</strong> attendees. Each will
              receive a personalized email. This cannot be undone.
            </Alert>
          ) : (
            <Alert variant="success">
              Sent {bulkResult.successful} of {bulkResult.total}.
              {bulkResult.failed.length > 0 && (
                <ul className="mb-0 mt-2">
                  {bulkResult.failed.map((f, i) => (
                    <li key={i}>
                      Attendee #{f.attendeeId}: {f.reason}
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={pending} onClick={() => setShowBulkModal(false)}>
            Close
          </Button>
          {!bulkResult && (
            <Button variant="warning" disabled={pending} onClick={handleBulkConfirm}>
              {pending ? 'Sending...' : 'Confirm & Send'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}
