import { Badge, Image } from 'react-bootstrap'

export type DirectoryAttendee = {
  id: number
  firstName: string
  lastName: string
  company: string
  position: string
  country: string | null
  industry: string | null
  networkingStatus: string
  bio: string | null
  interests: string[]
  profileImageUrl: string | null
}

export default function AttendeeCard({
  attendee,
  onViewProfile,
  onConnect,
}: {
  attendee: DirectoryAttendee
  onViewProfile: () => void
  onConnect: () => void
}) {
  const isOpen = attendee.networkingStatus !== 'busy'

  return (
    <div className="attendee-card">
      <div className="attendee-card-top">
        {attendee.profileImageUrl ? (
          <Image
            src={attendee.profileImageUrl}
            roundedCircle
            width={56}
            height={56}
            style={{ objectFit: 'cover' }}
            className="attendee-card-avatar"
            alt=""
          />
        ) : (
          <div className="attendee-card-avatar attendee-card-avatar-fallback">
            {attendee.firstName[0]}
            {attendee.lastName[0]}
          </div>
        )}
        <span
          className={`attendee-status-dot ${isOpen ? 'attendee-status-open' : 'attendee-status-busy'}`}
          title={isOpen ? 'Open to connect' : 'Not available right now'}
        />
      </div>

      <div className="attendee-card-name">
        {attendee.firstName} {attendee.lastName}
      </div>
      <div className="attendee-card-role">
        {attendee.position} at {attendee.company}
      </div>

      <div className="attendee-card-meta">
        {attendee.country && (
          <span className="attendee-card-meta-item">
            <i className="bi bi-geo-alt me-1" />
            {attendee.country}
          </span>
        )}
        {attendee.industry && <Badge className="attendee-industry-badge">{attendee.industry}</Badge>}
      </div>

      <div className={`attendee-status-label ${isOpen ? 'text-success' : 'text-muted'}`}>
        {isOpen ? 'Open to connect' : 'Not available right now'}
      </div>

      <div className="attendee-card-actions">
        <button className="btn btn-outline-primary btn-sm" onClick={onViewProfile}>
          View Profile
        </button>
        <button className="btn btn-primary btn-sm" onClick={onConnect}>
          Connect
        </button>
      </div>
    </div>
  )
}
