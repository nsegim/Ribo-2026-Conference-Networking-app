import { Modal, Badge, Image, Button } from 'react-bootstrap'
import type { DirectoryAttendee } from './AttendeeCard'

export default function ProfileDetailModal({
  attendee,
  onClose,
  onConnect,
}: {
  attendee: DirectoryAttendee | null
  onClose: () => void
  onConnect: (attendee: DirectoryAttendee) => void
}) {
  return (
    <Modal show={!!attendee} onHide={onClose} centered>
      {attendee && (
        <>
          <Modal.Header closeButton>
            <Modal.Title>
              {attendee.firstName} {attendee.lastName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex align-items-center mb-3">
              {attendee.profileImageUrl ? (
                <Image
                  src={attendee.profileImageUrl}
                  roundedCircle
                  width={64}
                  height={64}
                  style={{ objectFit: 'cover' }}
                  className="me-3"
                  alt=""
                />
              ) : (
                <div
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                  style={{ width: 64, height: 64, fontSize: 22 }}
                >
                  {attendee.firstName[0]}
                  {attendee.lastName[0]}
                </div>
              )}
              <div>
                <div className="fw-bold">
                  {attendee.position} at {attendee.company}
                </div>
                {attendee.country && <div className="text-muted small">{attendee.country}</div>}
              </div>
            </div>

            <div className="mb-3">
              <span
                className={`attendee-status-dot me-2 ${
                  attendee.networkingStatus !== 'busy' ? 'attendee-status-open' : 'attendee-status-busy'
                }`}
                style={{ position: 'static', display: 'inline-block' }}
              />
              <span className={attendee.networkingStatus !== 'busy' ? 'text-success' : 'text-muted'}>
                {attendee.networkingStatus !== 'busy' ? 'Open to connect' : 'Not available right now'}
              </span>
            </div>

            {attendee.industry && (
              <div className="mb-3">
                <div className="text-muted small mb-1">Industry</div>
                <Badge className="attendee-industry-badge">{attendee.industry}</Badge>
              </div>
            )}

            {attendee.bio && (
              <div className="mb-3">
                <div className="text-muted small mb-1">About</div>
                <p className="mb-0">{attendee.bio}</p>
              </div>
            )}

            {attendee.interests.length > 0 && (
              <div>
                <div className="text-muted small mb-1">Interests</div>
                {attendee.interests.map((i) => (
                  <Badge key={i} bg="light" text="dark" className="me-1 mb-1 border">
                    {i}
                  </Badge>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={() => onConnect(attendee)}>
              Connect
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  )
}
