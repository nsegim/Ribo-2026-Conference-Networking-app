'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Row, Col, Card, Form, Button, Badge, Modal, Alert, Image } from 'react-bootstrap'
import { sendMessage } from './actions'

type DirectoryAttendee = {
  id: number
  firstName: string
  lastName: string
  company: string
  position: string
  country: string | null
  bio: string | null
  interests: string[]
  profileImageUrl: string | null
}

export default function DirectoryClient({
  attendees,
  search,
}: {
  attendees: DirectoryAttendee[]
  search: string
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)
  const [selected, setSelected] = useState<DirectoryAttendee | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchInput ? `?search=${encodeURIComponent(searchInput)}` : ''
    router.push(`/networking-directory${query}`)
  }

  const openContact = (a: DirectoryAttendee) => {
    setSelected(a)
    setSubject('')
    setBody('')
    setResult(null)
  }

  const handleSend = () => {
    if (!selected) return
    startTransition(async () => {
      const res = await sendMessage(selected.id, subject, body)
      if (res.success) {
        setResult({ ok: true, message: 'Message sent!' })
        setSubject('')
        setBody('')
      } else {
        setResult({ ok: false, message: res.error })
      }
    })
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1 className="h2 mb-1">Networking Directory</h1>
          <p className="text-muted">Connect with other conference attendees</p>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={10}>
                <Form.Control
                  type="text"
                  placeholder="Search by name, company, or position..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100">
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <p className="text-muted">{attendees.length} attendee(s)</p>

      <Row className="g-3">
        {attendees.map((a) => (
          <Col key={a.id} md={6} lg={4}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  {a.profileImageUrl ? (
                    <Image
                      src={a.profileImageUrl}
                      roundedCircle
                      width={48}
                      height={48}
                      style={{ objectFit: 'cover' }}
                      className="me-2"
                      alt=""
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                      style={{ width: 48, height: 48 }}
                    >
                      {a.firstName[0]}
                      {a.lastName[0]}
                    </div>
                  )}
                  <div>
                    <strong>
                      {a.firstName} {a.lastName}
                    </strong>
                    <div className="text-muted small">
                      {a.position} at {a.company}
                    </div>
                  </div>
                </div>
                {a.country && <div className="text-muted small mb-2">{a.country}</div>}
                {a.bio && <p className="small mb-2">{a.bio}</p>}
                {a.interests.length > 0 && (
                  <div className="mb-2">
                    {a.interests.map((i) => (
                      <Badge key={i} bg="light" text="dark" className="me-1 mb-1 border">
                        {i}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button variant="outline-primary" size="sm" onClick={() => openContact(a)}>
                  Contact
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {attendees.length === 0 && (
        <p className="text-center text-muted py-5">No attendees found{search ? ` for "${search}"` : ''}.</p>
      )}

      <Modal show={!!selected} onHide={() => setSelected(null)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Contact {selected?.firstName} {selected?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {result && <Alert variant={result.ok ? 'success' : 'danger'}>{result.message}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              placeholder="Meeting request or message subject"
            />
            <Form.Text className="text-muted">{subject.length}/100</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={300}
              placeholder="Your message"
            />
            <Form.Text className="text-muted">{body.length}/300</Form.Text>
          </Form.Group>
          <Alert variant="info" className="mb-0 small">
            Your email address is never shown — they can reply directly to reach you.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSend} disabled={pending || !subject.trim() || !body.trim()}>
            {pending ? 'Sending...' : 'Send Message'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
