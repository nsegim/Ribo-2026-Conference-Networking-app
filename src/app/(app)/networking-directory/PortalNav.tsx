'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Navbar, Nav, Container, Badge } from 'react-bootstrap'

export default function PortalNav({
  fullName,
  unreadCount,
}: {
  fullName: string
  unreadCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/custom/magic-link/logout', { method: 'POST' })
    router.push('/networking-directory')
    router.refresh()
  }

  const items = [
    { href: '/networking-directory', label: 'Directory' },
    { href: '/networking-directory/inbox', label: 'Inbox', badge: unreadCount },
    { href: '/networking-directory/sessions', label: 'Sessions' },
    { href: '/networking-directory/profile', label: 'My Profile' },
  ]

  return (
    <Navbar bg="dark" variant="dark" expand="md" className="mb-4">
      <Container>
        <Navbar.Brand>RIBO2026 Networking</Navbar.Brand>
        <Navbar.Toggle aria-controls="portal-nav" />
        <Navbar.Collapse id="portal-nav">
          <Nav className="me-auto">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active fw-bold' : ''}`}
              >
                {item.label}
                {!!item.badge && (
                  <Badge bg="danger" className="ms-1">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </Nav>
          <Nav>
            <Navbar.Text className="me-3">{fullName}</Navbar.Text>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
              Logout
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
