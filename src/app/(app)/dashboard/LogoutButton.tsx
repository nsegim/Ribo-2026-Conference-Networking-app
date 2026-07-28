'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="btn btn-link text-light text-decoration-none d-flex align-items-center p-2 w-100">
      <i className="bi bi-box-arrow-right me-2" />
      Logout
    </button>
  )
}
