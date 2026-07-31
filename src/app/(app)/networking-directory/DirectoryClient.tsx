'use client'

import { useState, useTransition } from 'react'
import { Form, Modal, Alert, Button } from 'react-bootstrap'
import { sendMessage } from './actions'
import DirectoryHero, { type DirectoryStats } from './DirectoryHero'
import DirectoryFilters, { type FilterOptions, type DirectoryFiltersValue } from './DirectoryFilters'
import AttendeeCard, { type DirectoryAttendee } from './AttendeeCard'
import ProfileDetailModal from './ProfileDetailModal'

export default function DirectoryClient({
  attendees,
  stats,
  filterOptions,
  filters,
}: {
  attendees: DirectoryAttendee[]
  stats: DirectoryStats
  filterOptions: FilterOptions
  filters: DirectoryFiltersValue
}) {
  const [viewProfile, setViewProfile] = useState<DirectoryAttendee | null>(null)
  const [contactTarget, setContactTarget] = useState<DirectoryAttendee | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const openContact = (a: DirectoryAttendee) => {
    setViewProfile(null)
    setContactTarget(a)
    setSubject('')
    setBody('')
    setResult(null)
  }

  const handleSend = () => {
    if (!contactTarget) return
    startTransition(async () => {
      const res = await sendMessage(contactTarget.id, subject, body)
      if (res.success) {
        setResult({ ok: true, message: 'Message sent!' })
        setSubject('')
        setBody('')
      } else {
        setResult({ ok: false, message: res.error })
      }
    })
  }

  const hasActiveFilters =
    filters.search || filters.company || filters.country || filters.industry || filters.availability

  return (
    <div>
      <DirectoryHero stats={stats} />

      <DirectoryFilters filters={filters} options={filterOptions} />

      <p className="text-muted mb-3">{attendees.length} attendee(s)</p>

      {attendees.length > 0 ? (
        <div className="attendee-grid">
          {attendees.map((a) => (
            <AttendeeCard
              key={a.id}
              attendee={a}
              onViewProfile={() => setViewProfile(a)}
              onConnect={() => openContact(a)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted py-5">
          <p className="mb-0">No attendees found{hasActiveFilters ? ' matching your filters' : ''}.</p>
        </div>
      )}

      <ProfileDetailModal attendee={viewProfile} onClose={() => setViewProfile(null)} onConnect={openContact} />

      <Modal show={!!contactTarget} onHide={() => setContactTarget(null)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Contact {contactTarget?.firstName} {contactTarget?.lastName}
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
          <Button variant="secondary" onClick={() => setContactTarget(null)}>
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
