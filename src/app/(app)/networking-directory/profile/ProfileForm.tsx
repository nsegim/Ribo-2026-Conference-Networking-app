'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Row, Col, Card, Form, Button, Alert, Badge, Image } from 'react-bootstrap'
import { updateProfile } from '../actions'

type ProfileData = {
  firstName: string
  lastName: string
  email: string
  company: string
  position: string
  category: string
  qrCode: string | null
  country: string
  industry: string
  networkingStatus: string
  bio: string
  showInDirectory: boolean
  interests: string
  profileImageUrl: string | null
}

export default function ProfileForm({ attendee }: { attendee: ProfileData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [preview, setPreview] = useState<string | null>(attendee.profileImageUrl)

  const handleSubmit = (formData: FormData) => {
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Row>
      <Col lg={7}>
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">My Networking Profile</h5>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">Profile updated.</Alert>}
            <Form action={handleSubmit}>
              <div className="d-flex align-items-center mb-3">
                {preview ? (
                  <Image
                    src={preview}
                    roundedCircle
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover' }}
                    className="me-3"
                    alt=""
                  />
                ) : (
                  <div
                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: 72, height: 72, fontSize: 24 }}
                  >
                    {attendee.firstName[0]}
                    {attendee.lastName[0]}
                  </div>
                )}
                <Form.Group>
                  <Form.Label className="small mb-1">Profile photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={(e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) setPreview(URL.createObjectURL(file))
                    }}
                  />
                </Form.Group>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Bio</Form.Label>
                <Form.Control as="textarea" rows={3} name="bio" defaultValue={attendee.bio} maxLength={500} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Interests</Form.Label>
                <Form.Control name="interests" defaultValue={attendee.interests} placeholder="Comma-separated, e.g. Reinsurance, InsurTech" />
                <Form.Text className="text-muted">Comma-separated, up to 15</Form.Text>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Control name="country" defaultValue={attendee.country} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Industry</Form.Label>
                    <Form.Control
                      name="industry"
                      defaultValue={attendee.industry}
                      placeholder="e.g. Reinsurance"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Networking availability</Form.Label>
                <Form.Select name="networkingStatus" defaultValue={attendee.networkingStatus}>
                  <option value="open">Open to connect</option>
                  <option value="busy">Not available right now</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Shown as a status indicator on your directory card.
                </Form.Text>
              </Form.Group>

              <Form.Check
                type="checkbox"
                name="showInDirectory"
                label="Show my profile in the networking directory"
                defaultChecked={attendee.showInDirectory}
                className="mb-3"
              />

              <Button variant="primary" type="submit" disabled={pending}>
                {pending ? 'Saving...' : 'Save Profile'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={5}>
        <Card>
          <Card.Header>
            <h5 className="mb-0">Registration Details</h5>
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">
              These fields come from your conference registration. Contact the organizers if
              anything here needs correcting.
            </p>
            <p>
              <strong>Name:</strong> {attendee.firstName} {attendee.lastName}
            </p>
            <p>
              <strong>Position:</strong> {attendee.position}
            </p>
            <p>
              <strong>Company:</strong> {attendee.company}
            </p>
            <p>
              <strong>Email:</strong> {attendee.email}
            </p>
            <p>
              <strong>Category:</strong> <Badge bg="secondary">{attendee.category}</Badge>
            </p>
            {attendee.qrCode && (
              <>
                <hr />
                <p className="mb-2">
                  <strong>Your check-in code:</strong>
                </p>
                <div className="text-center">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(attendee.qrCode)}`}
                    alt="QR code"
                    width={160}
                    height={160}
                  />
                  <p className="text-muted small mt-2">Show this at check-in if you don&apos;t have a printed badge.</p>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
