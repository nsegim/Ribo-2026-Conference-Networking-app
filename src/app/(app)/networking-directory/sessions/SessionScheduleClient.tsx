'use client'

import { Card, ListGroup, Badge } from 'react-bootstrap'

type SessionRow = {
  id: number
  name: string
  date: string
  description: string
  isActive: boolean
}

export default function SessionScheduleClient({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div>
      <h1 className="h2 mb-4">Conference Schedule</h1>
      <Card>
        <Card.Body>
          {sessions.length === 0 ? (
            <p className="text-muted mb-0">No sessions have been published yet.</p>
          ) : (
            <ListGroup variant="flush">
              {sessions.map((s) => (
                <ListGroup.Item key={s.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{s.name}</strong>
                      {s.description && <p className="mb-0 text-muted small">{s.description}</p>}
                    </div>
                    <div className="text-end">
                      <div>{new Date(s.date).toLocaleString()}</div>
                      {s.isActive && (
                        <Badge bg="success" className="mt-1">
                          Happening now
                        </Badge>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
