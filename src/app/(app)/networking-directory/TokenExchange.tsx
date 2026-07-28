'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner, Alert, Card } from 'react-bootstrap'

// Consumes the ?token= query param from the magic-link email: exchanges it for a persistent
// session cookie via the Phase 2 validate endpoint, then reloads onto the clean URL. This is a
// Client Component specifically because setting a cookie in response to a token requires a real
// request (Route Handler), which a Server Component render can't do on its own.
export default function TokenExchange({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function exchange() {
      try {
        const res = await fetch('/api/custom/magic-link/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const body = await res.json()
        if (cancelled) return

        if (!res.ok || body.status !== 'success') {
          setError(body.message || 'This link is invalid or has expired.')
          return
        }

        router.replace('/networking-directory')
        router.refresh()
      } catch {
        if (!cancelled) setError('Something went wrong validating your link. Please try again.')
      }
    }

    exchange()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (error) {
    return (
      <Container className="mt-5" style={{ maxWidth: 480 }}>
        <Card>
          <Card.Body className="text-center">
            <h4 className="mb-3">Link Not Valid</h4>
            <Alert variant="danger">{error}</Alert>
            <p className="text-muted mb-0">
              Magic links are single-use and expire after 7 days. Contact the conference organizers
              for a new link.
            </p>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container className="mt-5 text-center">
      <Spinner animation="border" />
      <p className="mt-3 text-muted">Signing you in&hellip;</p>
    </Container>
  )
}
