'use client'

import { Container, Alert, Card } from 'react-bootstrap'

// react-bootstrap isn't built with RSC 'use client' directives internally, so it can't be
// rendered directly inside an async Server Component (same lesson as the admin dashboard).
export default function InvalidLinkNotice() {
  return (
    <Container className="mt-5" style={{ maxWidth: 480 }}>
      <Card>
        <Card.Body className="text-center">
          <h4 className="mb-3">Welcome to RIBO2026 Networking</h4>
          <Alert variant="warning" className="mb-0">
            This page requires a personal access link. Please use the magic link sent to your
            email, or contact the conference organizers if you need a new one.
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  )
}
