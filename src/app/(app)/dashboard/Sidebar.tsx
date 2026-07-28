import Link from 'next/link'
import type { AdminRole } from '@/lib/getCurrentAdminUser'
import LogoutButton from './LogoutButton'

type NavItem = {
  href: string
  label: string
  icon: string
  roles: AdminRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['superadmin', 'admin'] },
  { href: '/dashboard/attendees', label: 'Attendees', icon: 'bi-people', roles: ['superadmin', 'admin'] },
  { href: '/dashboard/sessions', label: 'Sessions', icon: 'bi-calendar-event', roles: ['superadmin', 'admin'] },
  { href: '/dashboard/check-in', label: 'Check-In', icon: 'bi-qr-code-scan', roles: ['superadmin', 'admin', 'staff'] },
  { href: '/dashboard/magic-links', label: 'Magic Links', icon: 'bi-link-45deg', roles: ['superadmin', 'admin'] },
]

export default function Sidebar({ role, fullName }: { role: AdminRole; fullName: string }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <div className="bg-dark text-white vh-100 position-fixed d-flex flex-column" style={{ width: 240, zIndex: 1000 }}>
      <div className="p-3 border-bottom border-secondary">
        <h5 className="mb-0">RIBO2026</h5>
        <small className="text-secondary">{fullName} &middot; {role}</small>
      </div>
      <nav className="nav flex-column p-2 flex-grow-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="btn btn-link text-start text-light text-decoration-none d-flex align-items-center p-2 mb-1 rounded"
          >
            <i className={`bi ${item.icon} me-2`} />
            {item.label}
          </Link>
        ))}
        {role === 'superadmin' && (
          <a
            href="/admin/collections/users"
            className="btn btn-link text-start text-light text-decoration-none d-flex align-items-center p-2 mb-1 rounded"
          >
            <i className="bi bi-person-gear me-2" />
            Manage Users
          </a>
        )}
      </nav>
      <div className="p-2 border-top border-secondary">
        <LogoutButton />
      </div>
    </div>
  )
}
