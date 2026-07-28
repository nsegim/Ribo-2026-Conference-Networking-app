import config from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'

export type AdminRole = 'superadmin' | 'admin' | 'staff'

export type AdminUser = {
  id: number
  email: string
  fullName: string
  role: AdminRole
}

// Uses Payload's own Local API auth resolution (payload.auth) rather than manually decoding the
// payload-token JWT ourselves — that token format is Payload-internal, this is the supported way
// to resolve "who is this request authenticated as" server-side.
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users') return null
  return user as unknown as AdminUser
}

// Call at the top of any (dashboard) page. Redirects to /login if not authenticated, or to
// /dashboard/check-in if the role isn't in `allowedRoles` (staff hitting an admin-only page).
export async function requireAdminUser(allowedRoles?: AdminRole[]): Promise<AdminUser> {
  const user = await getCurrentAdminUser()
  if (!user) redirect('/login')
  if (allowedRoles && !allowedRoles.includes(user.role)) redirect('/dashboard/check-in')
  return user
}
